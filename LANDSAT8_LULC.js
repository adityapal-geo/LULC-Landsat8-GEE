
//LULC MAP USING LANDSAT8 IN GOOGLE EARTH ENGINE

// ================= STUDY AREA =================
Map.centerObject(roi, 10);
Map.addLayer(roi, {}, 'ROI');

var landsat = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
  .filterBounds(roi)
  .filterDate('2025-03-01', '2025-03-31')
  .filter(ee.Filter.lt('CLOUD_COVER', 10))
  .median()
  .clip(roi);
  
  var image = landsat.select(['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'])
  .multiply(0.0000275)
  .add(-0.2);
  
  Map.addLayer(image, {
  bands: ['SR_B5','SR_B4','SR_B3'],
  min: 0.05,
  max: 0.4
}, 'FCC Landsat 8/9');
  
// ================= INDICES =================

// NDVI (Vegetation)
var ndvi = image.normalizedDifference(['SR_B4','SR_B3']).rename('NDVI');

// NDBI (Built-up)
var ndbi = image.normalizedDifference(['SR_B5','SR_B4']).rename('NDBI');

// MNDWI (Water)
var mndwi = image.normalizedDifference(['SR_B2','SR_B5']).rename('MNDWI');

// Add bands
image = image.addBands([ndvi, ndbi, mndwi]);

// ================= TRAINING DATA =================

var water = water.map(function(f){ return f.set('Class', 1); });
var vegetation = vegetation.map(function(f){ return f.set('Class', 2); });
var builtup = builtup.map(function(f){ return f.set('Class', 3); });
var agriculture = agriculture.map(function(f){ return f.set('Class', 4); });
var sandbar = sandbar.map(function(f){ return f.set('Class', 5); });
var industry = industry.map(function(f){ return f.set('Class', 6); });
var mining = mining.map(function(f){ return f.set('Class', 7); });
var barrenland = barrenland.map(function(f){ return f.set('Class', 8); });

// Merge all classes
var training = water.merge(vegetation)
  .merge(builtup)
  .merge(agriculture)
  .merge(sandbar)
  .merge(industry)
  .merge(mining)
  .merge(barrenland);

// ================= SAMPLE =================
var trainingData = image.sampleRegions({
  collection: training,
  properties: ['Class'],
  scale: 30
});

// ================= RANDOM FOREST =================
var classifier = ee.Classifier.smileRandomForest(200).train({
  features: trainingData,
  classProperty: 'Class',
  inputProperties: image.bandNames()
});

// Classification
var classified = image.classify(classifier);

// ================= VISUALIZATION =================
var palette = [
  '0000FF', // Water
  '008000', // Vegetation
  'FF0000', // Built-up
  'FFFF00', // Agriculture
  'FFFFFF', // Sandbar
  'FFA500', // Industry
  '800080', // Mining
  'A52A2A'  // Barren Land
];

Map.addLayer(classified, {min:1, max:8, palette: palette}, 'LULC 2025');

// ================= ACCURACY =================
var withRandom = trainingData.randomColumn();

var trainSet = withRandom.filter(ee.Filter.lt('random', 0.7));
var testSet = withRandom.filter(ee.Filter.gte('random', 0.7));

var trained = ee.Classifier.smileRandomForest(100).train({
  features: trainSet,
  classProperty: 'Class',
  inputProperties: image.bandNames()
});

var test = testSet.classify(trained);

var confusionMatrix = test.errorMatrix('Class', 'classification');

print('Confusion Matrix:', confusionMatrix);
print('Overall Accuracy:', confusionMatrix.accuracy());
print('Kappa:', confusionMatrix.kappa());

// ================= AREA CALCULATION =================

// Pixel area + class
var areaImage = ee.Image.pixelArea().addBands(classified.rename('Class'));

// Reduce
var areas = areaImage.reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1,
    groupName: 'Class'
  }),
  geometry: roi,
  scale: 30,
  maxPixels: 1e13
});

// Convert to km²
var classArea = ee.List(areas.get('groups')).map(function(item){
  var d = ee.Dictionary(item);
  
  return ee.Dictionary({
    Class: d.get('Class'),
    Area_km2: ee.Number(d.get('sum')).divide(1e6)
  });
});

// ================= CLASS NAMES =================
var classNames = ee.Dictionary({
  1: 'Water',
  2: 'Vegetation',
  3: 'Built-up',
  4: 'Agriculture',
  5: 'Sandbar',
  6: 'Industry',
  7: 'Mining',
  8: 'Barren Land'
});

// FeatureCollection
var areaFC = ee.FeatureCollection(
  classArea.map(function(item){
    item = ee.Dictionary(item);
    
    return ee.Feature(null, {
      LandCover: classNames.get(item.get('Class')),
      Area_km2: item.get('Area_km2')
    });
  })
);

print('Area Table (km²):', areaFC);

// ================= PIE CHART =================
var pieChart = ui.Chart.feature.byFeature({
  features: areaFC,
  xProperty: 'LandCover',
  yProperties: ['Area_km2']
})
.setChartType('PieChart')
.setOptions({
  title: 'LULC Area Distribution 2025 (km²)',
  pieHole: 0.4
});

print(pieChart);

// ================= EXPORT =================

// Image
Export.image.toDrive({
  image: classified,
  description: 'LULC_2025_Asansol',
  region: roi,
  scale: 30,
  maxPixels: 1e13
});

// Table
Export.table.toDrive({
  collection: areaFC,
  description: 'LULC_Area_2025',
  fileFormat: 'CSV'
});
