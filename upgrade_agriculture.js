const fs = require('fs');
const file = 'courses/agriculture.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Deep Engineering Curriculum Upgrade for Agriculture
data.description = "Advanced precision agriculture pipelines combining Edge AI, multispectral imaging, and autonomous flight swarms. Build end-to-end data systems that process raw sensor feeds into actionable agronomic insights in real-time.";

// Deepen the modules
data.modules = [
  {
    "id": " multispectral-processing ",
    "title": "Multispectral & Hyperspectral Processing Pipeline",
    "description": "Develop low-latency pipelines for radiometric calibration, band alignment, and vegetative index calculation on Edge TPUs and Jetson devices.",
    "topics": [
      "Radiometric Calibration & Reflectance Conversion",
      "Multispectral Image Registration & Band Alignment (SIFT/SURF)",
      "CUDA-accelerated NDVI/NDRE calculation",
      "Thermal-Optical Sensor Fusion",
      "Handling Multi-Camera Array Synchronization"
    ]
  },
  {
    "id": "autonomous-crop-scouting",
    "title": "Autonomous Swarm Crop Scouting",
    "description": "Deploy distributed ROS 2 architectures to control drone swarms over massive agricultural networks.",
    "topics": [
      "Coverage Path Planning (Boustrophedon paths)",
      "Distributed ROS 2 DDS & Multi-Agent Communication",
      "Terrain Following using LiDAR/Radar Altimeters",
      "Dynamic Re-routing for Battery Management",
      "Edge-to-Cloud telemetry synchronization"
    ]
  },
  {
    "id": "ai-disease-detection",
    "title": "Edge AI Plant Disease & Weed Detection",
    "description": "Train and deploy quantized Object Detection models capable of identifying tiny anomalies at high flight speeds.",
    "topics": [
      "Dataset Generation with synthetic environments (Isaac Sim)",
      "YOLOv8 & RT-DETR model fine-tuning for agriculture",
      "TensorRT optimization & FP16/INT8 quantization",
      "DeepSORT for precise weed counting & localization",
      "Real-time targeted spraying actuator integration (ROS Action Servers)"
    ]
  },
  {
    "id": "agronomic-data-lake",
    "title": "Agronomic Data Lake & Spatial Analytics",
    "description": "Design a scalable backend infrastructure handling terabytes of geospatial imagery and telemetry data.",
    "topics": [
      "PostGIS for spatial querying and intersection",
      "Cloud Optimized GeoTIFFs (COG) & STAC APIs",
      "Automated Orthomosaic Generation (OpenDroneMap Integration)",
      "Time-Series Crop Yield Prediction (LSTM/Transformers)",
      "Data pipeline orchestration with Apache Airflow"
    ]
  }
];

// Add glossary terms tailored to the advanced curriculum
data.glossary = [
  { "term": "Radiometric Calibration", "definition": "The process of converting raw digital pixel numbers into physical units like reflectance, accounting for ambient light sensors." },
  { "term": "NVDI", "definition": "Normalized Difference Vegetation Index. A mathematical formula derived from Near-Infrared and Red light bands used to quantify vegetation greenness." },
  { "term": "Cloud Optimized GeoTIFF", "definition": "A regular GeoTIFF file, hosted on a HTTP file server, with an internal organization that enables efficient network streaming and partial reading." },
  { "term": "Boustrophedon", "definition": "A continuous back-and-forth path planning pattern commonly used for complete area coverage in farming and surveying." },
  { "term": "STAC", "definition": "SpatioTemporal Asset Catalog. A standard API specification that provides a common language to describe geospatial information for indexing." }
];

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log("Upgraded Agriculture Domain");
