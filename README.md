# LULC-Landsat8-GEE
Land Use Land Cover (LULC) classification using Landsat 8 in Google Earth Engine with Random Forest, indices, accuracy assessment, and area calculation.


## Overview
This project performs Land Use Land Cover (LULC) classification using Landsat 8 imagery in Google Earth Engine.

## Data Used
- Landsat 8 Surface Reflectance (Collection 2)
- Date: March 2025
- Cloud cover < 10%

## Methodology
- Preprocessing (Scaling & Clipping)
- Spectral Indices:
  - NDVI (Vegetation)
  - NDBI (Built-up)
  - MNDWI (Water)
- Supervised Classification:
  - Random Forest (200 trees)
- Accuracy Assessment:
  - Confusion Matrix
  - Overall Accuracy
  - Kappa Coefficient
- Area Calculation (km²)
- Pie Chart Visualization

## Classes
1. Water
2. Vegetation
3. Built-up
4. Agriculture
5. Sandbar
6. Industry
7. Mining
8. Barren Land

## Outputs
- LULC Map
- Area Statistics (CSV)
- Accuracy Metrics
- Pie Chart

## Export
- GeoTIFF (LULC Map)
- CSV (Area Table)

## Platform
Google Earth Engine (JavaScript API)

## Study Area
Define your ROI (Region of Interest) before running the script.

## Note
Training data (FeatureCollections) must be created manually in GEE.

## Author
Aditya Pal
