# Lesson 1: Kubernetes for AI Workloads

## Learning Objectives
- Deploy a GPU-enabled Kubernetes cluster for ML training and inference
- Configure NVIDIA GPU Operator for exposing GPUs to pods
- Schedule AI workloads with proper resource requests and limits

## Why Kubernetes for Drone AI?

Drone AI involves multiple services: model training, model serving, data processing, monitoring. Kubernetes orchestrates all of these:

```
Kubernetes Cluster
├── Training Namespace
│   ├── Training Job (4× A100 GPUs)
│   ├── Data Preprocessing Pod (CPU)
│   └── Experiment Tracker (MLflow)
├── Serving Namespace
│   ├── Triton Inference Server (2× T4 GPUs)
│   ├── API Gateway
│   └── Load Balancer
├── Data Namespace
│   ├── MinIO (Object Storage)
│   ├── PostgreSQL + PostGIS
│   └── Redis (Feature Store)
└── Monitoring Namespace
    ├── Prometheus
    ├── Grafana
    └── Evidently AI
```

## Setting Up GPU Nodes

### NVIDIA GPU Operator Installation

The GPU Operator automates the management of NVIDIA software components needed for GPU provisioning:

```yaml
# gpu-operator-values.yaml
operator:
  defaultRuntime: containerd

driver:
  enabled: true        # Install NVIDIA drivers
  version: "550.54.15"

toolkit:
  enabled: true        # NVIDIA Container Toolkit

devicePlugin:
  enabled: true        # Expose GPUs as k8s resources

dcgmExporter:
  enabled: true        # GPU metrics for monitoring

mig:
  strategy: single     # Multi-Instance GPU strategy
```

```bash
# Install GPU Operator
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm repo update

helm install gpu-operator nvidia/gpu-operator \
  --namespace gpu-operator \
  --create-namespace \
  -f gpu-operator-values.yaml

# Verify GPUs are available
kubectl get nodes -o json | jq '.items[].status.allocatable["nvidia.com/gpu"]'
```

### Training Job with GPU Resources

```yaml
# drone-training-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: fire-detection-training
  namespace: training
spec:
  template:
    spec:
      containers:
      - name: trainer
        image: drone-ai/fire-trainer:v1.2
        command: ["python", "train.py"]
        args:
          - "--model=vit_base"
          - "--epochs=100"
          - "--batch-size=64"
          - "--data=/data/fire-dataset-v3"
        resources:
          requests:
            nvidia.com/gpu: 2
            memory: "32Gi"
            cpu: "8"
          limits:
            nvidia.com/gpu: 2
            memory: "64Gi"
            cpu: "16"
        volumeMounts:
        - name: training-data
          mountPath: /data
        - name: model-output
          mountPath: /output
        env:
        - name: WANDB_API_KEY
          valueFrom:
            secretKeyRef:
              name: wandb-secret
              key: api-key
      volumes:
      - name: training-data
        persistentVolumeClaim:
          claimName: drone-dataset-pvc
      - name: model-output
        persistentVolumeClaim:
          claimName: model-artifacts-pvc
      restartPolicy: Never
  backoffLimit: 3
```

## Auto-Scaling GPU Nodes with Karpenter

```yaml
# karpenter-gpu-provisioner.yaml
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: gpu-training
spec:
  template:
    spec:
      requirements:
      - key: node.kubernetes.io/instance-type
        operator: In
        values: ["p4d.24xlarge", "g5.12xlarge", "g5.4xlarge"]
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["on-demand", "spot"]  # Use spot for training (cheaper)
      - key: kubernetes.io/arch
        operator: In
        values: ["amd64"]
      nodeClassRef:
        name: default
  limits:
    nvidia.com/gpu: "16"  # Max 16 GPUs in pool
  disruption:
    consolidationPolicy: WhenEmpty
    consolidateAfter: 30s

---
# Separate pool for inference (always-on, on-demand)
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: gpu-inference
spec:
  template:
    spec:
      requirements:
      - key: node.kubernetes.io/instance-type
        operator: In
        values: ["g5.xlarge", "g5.2xlarge"]
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["on-demand"]  # Inference needs reliability
  limits:
    nvidia.com/gpu: "8"
  disruption:
    consolidationPolicy: WhenEmpty
    consolidateAfter: 300s  # Wait 5 min before scaling down
```

## Hands-On Lab

### Exercise 1: Local GPU Cluster
1. Set up a local Kubernetes cluster with `kind` or `minikube`
2. Install NVIDIA GPU Operator (or simulate with `nvidia/device-plugin`)
3. Deploy a training job that uses 1 GPU
4. Monitor GPU utilization with `nvidia-smi` and DCGM exporter

### Exercise 2: Karpenter Auto-Scaling
1. Configure Karpenter for GPU node auto-scaling
2. Submit 3 concurrent training jobs
3. Observe Karpenter provision new GPU nodes
4. After jobs complete, verify nodes scale down

## Key Takeaways

1. NVIDIA GPU Operator automates GPU driver and toolkit management
2. Use resource requests/limits to ensure GPU allocation and prevent contention
3. Karpenter provides intelligent auto-scaling for GPU nodes
4. Separate node pools for training (spot-tolerant) and inference (reliable)
5. Always set `backoffLimit` on training jobs to prevent infinite retries

## Next Lesson → Scheduling and Resource Management
