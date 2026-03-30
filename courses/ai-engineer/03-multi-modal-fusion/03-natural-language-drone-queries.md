# Lesson 3: Building Natural Language Drone Queries

## Learning Objectives
- Build a complete natural language drone image search system
- Combine multiple modalities: RGB, thermal, spatial, temporal
- Deploy a multi-modal retrieval API for drone operations

## System Architecture: DroneSearch

```
                         ┌─────────────────────┐
                         │   Query Interface    │
                         │ "Find thermal leaks  │
                         │  near power station" │
                         └─────────┬───────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │      Query Processor         │
                    │ • Text encoding              │
                    │ • Spatial filter (GPS)        │
                    │ • Temporal filter (date)      │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
    ┌─────────┴────────┐  ┌───────┴───────┐   ┌────────┴────────┐
    │  Text Similarity  │  │ Spatial Index │   │ Temporal Index  │
    │  (CLIP features)  │  │  (PostGIS)    │   │  (Timestamp)    │
    └─────────┬────────┘  └───────┬───────┘   └────────┬────────┘
              │                    │                     │
              └────────────────────┼─────────────────────┘
                                   │
                         ┌─────────┴───────────┐
                         │    Result Fusion     │
                         │  Weighted ranking    │
                         └─────────┬───────────┘
                                   │
                         ┌─────────┴───────────┐
                         │  Top-K Results with  │
                         │  thumbnails + maps   │
                         └─────────────────────┘
```

### Multi-Modal Feature Extraction

```python
import torch
import numpy as np
from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class DroneImage:
    image_path: str
    rgb_features: torch.Tensor        # CLIP visual features (512-d)
    thermal_features: Optional[torch.Tensor]  # Thermal CLIP features
    gps_lat: float
    gps_lon: float
    altitude_m: float
    heading_deg: float
    timestamp: datetime
    camera_type: str                   # "rgb", "thermal", "multispectral"
    metadata: dict                     # Any additional sensor data


class MultiModalIndexer:
    """Index drone images for multi-modal search."""
    
    def __init__(self, clip_model, clip_processor):
        self.model = clip_model
        self.processor = clip_processor
        self.index = []  # In production, use FAISS or Milvus
    
    def add_image(self, image_path, gps, altitude, heading, timestamp, camera_type):
        """Process and index a new drone image."""
        from PIL import Image
        
        img = Image.open(image_path)
        inputs = self.processor(images=img, return_tensors="pt")
        
        with torch.no_grad():
            features = self.model.encode_image(inputs["pixel_values"].cuda())
        
        entry = DroneImage(
            image_path=image_path,
            rgb_features=features.cpu(),
            thermal_features=None,
            gps_lat=gps[0],
            gps_lon=gps[1],
            altitude_m=altitude,
            heading_deg=heading,
            timestamp=timestamp,
            camera_type=camera_type,
            metadata={},
        )
        self.index.append(entry)
    
    def search(self, query, gps_center=None, radius_km=None, 
               time_start=None, time_end=None, top_k=10):
        """Multi-modal search combining text, spatial, and temporal filters."""
        
        # Step 1: Text similarity scores
        text_tokens = self.processor(text=query, return_tensors="pt", padding=True)
        with torch.no_grad():
            text_features = self.model.encode_text(text_tokens["input_ids"].cuda())
        
        candidates = self.index
        
        # Step 2: Spatial filtering (if GPS provided)
        if gps_center and radius_km:
            candidates = [
                img for img in candidates
                if haversine_distance(gps_center, (img.gps_lat, img.gps_lon)) <= radius_km
            ]
        
        # Step 3: Temporal filtering
        if time_start:
            candidates = [img for img in candidates if img.timestamp >= time_start]
        if time_end:
            candidates = [img for img in candidates if img.timestamp <= time_end]
        
        # Step 4: Rank by text similarity
        results = []
        for img in candidates:
            sim = torch.cosine_similarity(text_features, img.rgb_features.cuda())
            results.append((img, sim.item()))
        
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]


def haversine_distance(coord1, coord2):
    """Calculate distance between two GPS coordinates in km."""
    lat1, lon1 = np.radians(coord1)
    lat2, lon2 = np.radians(coord2)
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    
    return 6371 * c  # Earth radius in km
```

### Production Deployment with FAISS

```python
import faiss

class FAISSDroneIndex:
    """Scalable vector search for millions of drone images."""
    
    def __init__(self, dim=512):
        # IVF index for fast approximate search
        quantizer = faiss.IndexFlatIP(dim)  # Inner product = cosine for normalized vecs
        self.index = faiss.IndexIVFFlat(quantizer, dim, 100)  # 100 clusters
        self.metadata = []
    
    def build(self, features, metadata_list):
        """Build index from precomputed features."""
        features_np = features.numpy().astype('float32')
        faiss.normalize_L2(features_np)
        
        self.index.train(features_np)
        self.index.add(features_np)
        self.metadata = metadata_list
    
    def search(self, query_features, top_k=10):
        query_np = query_features.numpy().astype('float32')
        faiss.normalize_L2(query_np)
        
        distances, indices = self.index.search(query_np, top_k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            results.append({
                "metadata": self.metadata[idx],
                "similarity": distances[0][i],
            })
        return results
```

## Hands-On Lab

### Capstone: Drone Image Search Engine
Build a complete search system:
1. Index 1000+ drone images with CLIP features
2. Add GPS and timestamp metadata
3. Implement combined text + spatial + temporal search
4. Build a REST API with FastAPI
5. Create a simple web UI showing results on a map

## Key Takeaways

1. Effective drone search combines text similarity with spatial and temporal filters
2. FAISS enables scaling to millions of images with sub-second search
3. Multi-modal fusion goes beyond just images — GPS, altitude, time are all modalities
4. Production systems need proper indexing, not brute-force similarity search
5. The system architecture separates encoding, indexing, and retrieval for flexibility

## Course Complete → Next Course: Quantization & Optimization
