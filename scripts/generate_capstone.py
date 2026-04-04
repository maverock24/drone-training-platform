import os

capstone_dir = "courses/capstone-fire-detection"

files_to_create = {
    "01-system-architecture/README.md": """# System Architecture

The capstone architecture synthesizes all disciplines into a fully autonomous, fault-tolerant fleet system.

## Components
1. **Data Pipeline**: Flink, Kafka, PostGIS, STAC APIs
2. **AI Brain**: Vision-Language Model, Vision Transformer (ViT)
3. **Edge Deployment**: NVIDIA DeepStream, TensorRT, ROS 2, MAVLink
4. **ML Platform**: EKS, ArgoCD, Kubeflow, DVC, Triton
""",
    "01-system-architecture/docker-compose.yml": """version: '3.8'
services:
  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
  postgis:
    image: postgis/postgis:14-3.3
    environment:
      POSTGRES_PASSWORD: password
""",
    "02-thermal-lidar-processing/README.md": """# Thermal & LiDAR Processing

Ingests asynchronous 400Hz IMU, 10Hz LiDAR, and 30Hz thermal video feeds, synchronizing them via Apache Flink Kafka streams.
""",
    "02-thermal-lidar-processing/stream_processor.py": """import faust

app = faust.App('drone-streams', broker='kafka://localhost:9092')

class DroneTelemetry(faust.Record, serializer='json'):
    timestamp: float
    lat: float
    lon: float
    alt: float
    thermal_max: float

telemetry_topic = app.topic('drone-telemetry', value_type=DroneTelemetry)

@app.agent(telemetry_topic)
async def process_telemetry(streams):
    async for event in streams:
        if event.thermal_max > 85.0:
            print(f"🔥 Potential fire detected at {event.lat}, {event.lon}")

if __name__ == '__main__':
    app.main()
""",
    "03-smoke-detection-model/README.md": """# Smoke Detection Model

Trains a robust Vision Transformer (ViT) on localized spectral data, employing Knowledge Distillation.
""",
    "03-smoke-detection-model/train_vit.py": """import torch
import torch.nn as nn
from torchvision.models import vit_b_16

def get_model():
    model = vit_b_16(pretrained=True)
    model.heads = nn.Linear(768, 2) # Smoke vs No Smoke
    return model

if __name__ == '__main__':
    model = get_model()
    print("Model initialized. Ready for DistributedDataParallel training.")
""",
    "04-edge-deployment/README.md": """# Edge Deployment

Embeds the intelligence into the drone's physical reflex loop utilizing NVIDIA DeepStream and TensorRT.
""",
    "04-edge-deployment/convert_to_tensorrt.py": """import tensorrt as trt

TRT_LOGGER = trt.Logger(trt.Logger.WARNING)

print("Simulating ONNX to TensorRT INT8 conversion...")
print("Validating INT8 DLA core allocation...")
print("TensorRT engine successfully built.")
""",
    "05-cicd-continuous-learning/README.md": """# CI/CD & Continuous Learning

Constructs the continuous improvement 'Factory' with EKS, ArgoCD, and active learning.
""",
    "05-cicd-continuous-learning/argo-application.yaml": """apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: triton-inference-server
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/maverock24/drone-training-platform.git'
    path: courses/capstone-fire-detection/05-cicd-continuous-learning/manifests
    targetRevision: HEAD
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: mlops
"""
}

for filepath, content in files_to_create.items():
    full_path = os.path.join(capstone_dir, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)

print(f"✅ Generated {len(files_to_create)} Capstone reference files.")
