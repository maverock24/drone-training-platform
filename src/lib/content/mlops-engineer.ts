import { LessonContent } from "./types";

export const mlopsEngineerContent: LessonContent[] = [
  // ─── LESSON 1: Kubernetes for AI ───
  {
    lessonId: "k8s-ai",
    trackId: "mlops-engineer",
    moduleId: "iac",
    objectives: [
      "Deploy and configure NVIDIA GPU Operator on a Kubernetes cluster",
      "Schedule GPU workloads using resource requests and node selectors",
      "Implement dynamic GPU node scaling with Karpenter",
      "Set up multi-tenant GPU sharing with time-slicing and MIG",
      "Build production-grade GPU monitoring with DCGM and Prometheus",
    ],
    prerequisites: [
      "Basic Kubernetes concepts (Pods, Deployments, Services, Namespaces)",
      "Experience with kubectl and YAML manifests",
      "Understanding of container images and Docker",
    ],
    sections: [
      {
        id: "k8s-gpu-intro",
        title: "GPU-Powered Kubernetes for ML Workloads",
        type: "theory",
        content:
          "Training and serving drone AI models requires GPU acceleration, and Kubernetes has become the standard orchestration platform for ML workloads. But GPUs aren't like CPUs — they require specialized drivers, runtime libraries (CUDA), and careful scheduling to avoid resource conflicts.\n\nThe NVIDIA GPU Operator automates the management of all software components needed to provision GPUs in Kubernetes. It deploys and manages the NVIDIA driver, container runtime, device plugin, and monitoring tools as a single, versioned deployment. Without it, you'd need to install CUDA drivers on every node, configure the container runtime manually, and keep everything in sync across driver updates.\n\nFor drone AI platforms, Kubernetes with GPU Operator enables critical workflows: (1) training pipelines that scale GPU nodes up when a training job starts and down when it finishes, (2) inference serving that places models on specific GPU types (A100 for large models, T4 for cost-efficient serving), and (3) multi-tenant clusters where data engineers, AI engineers, and MLOps teams share GPU resources safely.\n\nKarpenter, AWS's node provisioning system, takes this further by making GPU scaling truly dynamic. Instead of pre-provisioning expensive GPU instances, Karpenter watches for pending pods that request GPU resources and automatically launches the right instance type. When the pods finish, it terminates the instances. This can reduce GPU cloud costs by 60-80% compared to always-on clusters.\n\nIn this lesson, you'll set up a production GPU cluster from scratch, deploy the GPU Operator, configure intelligent scheduling, and build monitoring dashboards.",
      },
      {
        id: "k8s-gpu-operator",
        title: "Deploying NVIDIA GPU Operator",
        type: "code",
        content:
          "The GPU Operator is deployed via Helm and manages all NVIDIA components as Kubernetes resources. This ensures GPU software stays in sync with your cluster and simplifies upgrades.",
        language: "bash",
        code: `# 1. Add NVIDIA Helm repository
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm repo update

# 2. Create GPU operator namespace
kubectl create namespace gpu-operator

# 3. Install GPU Operator with production configuration
helm install gpu-operator nvidia/gpu-operator \\
  --namespace gpu-operator \\
  --set driver.enabled=true \\
  --set driver.version="550.127.05" \\
  --set toolkit.enabled=true \\
  --set devicePlugin.enabled=true \\
  --set dcgm.enabled=true \\
  --set dcgmExporter.enabled=true \\
  --set migManager.enabled=true \\
  --set nodeStatusExporter.enabled=true \\
  --wait --timeout 10m

# 4. Verify GPU nodes are detected
kubectl get nodes -o json | jq '.items[].status.capacity["nvidia.com/gpu"]'

# 5. Test GPU access with a simple pod
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: gpu-test
spec:
  restartPolicy: Never
  containers:
  - name: cuda-test
    image: nvidia/cuda:12.4.1-base-ubuntu22.04
    command: ["nvidia-smi"]
    resources:
      limits:
        nvidia.com/gpu: 1
EOF

kubectl logs gpu-test  # Should show GPU info

# 6. Configure GPU time-slicing for multi-tenant sharing
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: time-slicing-config
  namespace: gpu-operator
data:
  any: |-
    version: v1
    flags:
      migStrategy: none
    sharing:
      timeSlicing:
        resources:
        - name: nvidia.com/gpu
          replicas: 4    # Each physical GPU appears as 4 virtual GPUs
EOF

# Patch the cluster policy to use time-slicing
kubectl patch clusterpolicies.nvidia.com/cluster-policy \\
  --type merge \\
  -p '{"spec":{"devicePlugin":{"config":{"name":"time-slicing-config"}}}}'`,
      },
      {
        id: "k8s-karpenter",
        title: "Dynamic GPU Scaling with Karpenter",
        type: "code",
        content:
          "Karpenter provisions the right GPU nodes on-demand based on pod requirements. This NodePool configuration defines what instance types are available and how Karpenter should manage them for drone AI workloads.",
        language: "bash",
        code: `# Karpenter NodePool for GPU workloads
cat <<'EOF' | kubectl apply -f -
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: gpu-training
spec:
  template:
    spec:
      requirements:
        - key: "karpenter.k8s.aws/instance-category"
          operator: In
          values: ["p", "g"]    # P-series (A100) and G-series (T4/L4)
        - key: "karpenter.k8s.aws/instance-gpu-count"
          operator: In
          values: ["1", "2", "4", "8"]
        - key: "kubernetes.io/arch"
          operator: In
          values: ["amd64"]
        - key: "karpenter.sh/capacity-type"
          operator: In
          values: ["spot", "on-demand"]  # Prefer spot for training
      nodeClassRef:
        name: gpu-node-class
  limits:
    cpu: "256"
    memory: "1024Gi"
    nvidia.com/gpu: "16"     # max 16 GPUs across all nodes
  disruption:
    consolidationPolicy: WhenUnderutilized
    consolidateAfter: 5m     # Scale down idle nodes after 5 min
---
apiVersion: karpenter.k8s.aws/v1beta1
kind: EC2NodeClass
metadata:
  name: gpu-node-class
spec:
  amiFamily: AL2
  role: "KarpenterNodeRole"
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: "drone-ai-cluster"
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: "drone-ai-cluster"
  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 200Gi    # Need space for model checkpoints
        volumeType: gp3
        iops: 10000
        throughput: 500
EOF

# Training job that triggers Karpenter to provision GPU nodes
cat <<'EOF' | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: drone-model-training
spec:
  template:
    spec:
      nodeSelector:
        karpenter.sh/nodepool: gpu-training
      containers:
      - name: trainer
        image: registry.example.com/drone-ai/trainer:latest
        command: ["python", "train.py", "--epochs=50", "--batch-size=128"]
        resources:
          requests:
            nvidia.com/gpu: 4
            memory: "64Gi"
            cpu: "16"
          limits:
            nvidia.com/gpu: 4
      restartPolicy: Never
  backoffLimit: 2
EOF`,
      },
      {
        id: "k8s-monitoring",
        title: "GPU Monitoring with DCGM and Prometheus",
        type: "code",
        content:
          "NVIDIA DCGM (Data Center GPU Manager) exposes GPU metrics that Prometheus can scrape. Combined with Grafana dashboards, this gives you real-time visibility into GPU utilization, memory, temperature, and power consumption — critical for cost optimization and debugging.",
        language: "bash",
        code: `# ServiceMonitor for DCGM Exporter (requires Prometheus Operator)
cat <<'EOF' | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: dcgm-exporter
  namespace: gpu-operator
spec:
  selector:
    matchLabels:
      app: nvidia-dcgm-exporter
  endpoints:
  - port: metrics
    interval: 15s
    path: /metrics
EOF

# Key Prometheus queries for GPU monitoring:
# GPU Utilization (should be >80% during training):
#   DCGM_FI_DEV_GPU_UTIL{pod=~"drone-.*"}
#
# GPU Memory Usage:
#   DCGM_FI_DEV_FB_USED / DCGM_FI_DEV_FB_FREE
#
# GPU Temperature (alert if >85°C):
#   DCGM_FI_DEV_GPU_TEMP > 85
#
# Power consumption (for cost estimation):
#   DCGM_FI_DEV_POWER_USAGE

# Grafana dashboard JSON for drone AI GPU monitoring
# Import dashboard ID 12239 from grafana.com for DCGM metrics

# PrometheusRule for GPU alerts
cat <<'EOF' | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: gpu-alerts
spec:
  groups:
  - name: gpu.rules
    rules:
    - alert: GPUUtilizationLow
      expr: avg_over_time(DCGM_FI_DEV_GPU_UTIL[10m]) < 20
      for: 15m
      labels:
        severity: warning
      annotations:
        summary: "GPU {{ $labels.gpu }} underutilized at {{ $value }}%"
        description: "Consider scaling down or right-sizing the GPU instance."
    - alert: GPUMemoryExhausted
      expr: DCGM_FI_DEV_FB_USED / (DCGM_FI_DEV_FB_USED + DCGM_FI_DEV_FB_FREE) > 0.95
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "GPU memory >95% used - risk of OOM"
EOF`,
      },
      {
        id: "k8s-exercise",
        title: "Lab: Deploy a GPU Training Cluster",
        type: "exercise",
        content:
          "Build a production-grade GPU Kubernetes cluster for drone AI workloads.\n\n**Task 1: Cluster Setup**\nCreate a Kubernetes cluster (EKS, GKE, or local with kind/minikube). Install the NVIDIA GPU Operator and verify GPU access with a test pod running nvidia-smi.\n\n**Task 2: GPU Scheduling**\nDeploy two workloads: (a) a training job requesting 2 GPUs, (b) an inference server requesting 1 GPU. Verify Kubernetes schedules them correctly and respects resource limits.\n\n**Task 3: Time-slicing**\nConfigure GPU time-slicing with 4 replicas per GPU. Deploy 4 inference pods, each requesting 1 GPU. Verify all 4 run on the same physical GPU.\n\n**Task 4: Karpenter Auto-scaling**\nConfigure a Karpenter NodePool for GPU instances. Submit a training job that requires more GPUs than currently available. Verify Karpenter provisions a new node, the job runs, and the node is terminated after the job completes.\n\n**Task 5: Monitoring Dashboard**\nDeploy Prometheus and Grafana. Configure DCGM metric scraping. Build a Grafana dashboard showing: GPU utilization, memory usage, temperature, and power consumption. Set up an alert for low GPU utilization (<20% for >15 minutes).",
      },
      {
        id: "k8s-summary",
        title: "Summary & Key Takeaways",
        type: "summary",
        content:
          "Kubernetes with NVIDIA GPU Operator is the foundation for scalable drone AI infrastructure. You've learned to deploy GPU software automatically, schedule workloads intelligently, scale nodes dynamically with Karpenter, and monitor GPU health with DCGM.\n\nThe key operational insight is cost management: GPUs are expensive ($1-30/hr per GPU in the cloud), and most training jobs don't use them 24/7. Karpenter's dynamic provisioning combined with spot instances can reduce your GPU bill by 60-80%. Time-slicing maximizes utilization for inference workloads.\n\nNext: Terraform/Pulumi, where you'll automate the creation of this entire infrastructure stack as reproducible code.",
      },
    ],
    keyTakeaways: [
      "GPU Operator automates NVIDIA driver, runtime, and plugin management on Kubernetes",
      "Karpenter dynamically provisions GPU nodes on-demand, reducing costs by 60-80%",
      "GPU time-slicing allows multiple pods to share a single physical GPU for inference",
      "DCGM + Prometheus + Grafana provides real-time GPU utilization and health monitoring",
      "Always set resource requests AND limits for GPU workloads to prevent scheduling conflicts",
    ],
    resources: [
      { title: "NVIDIA GPU Operator Documentation", url: "https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/" },
      { title: "Karpenter: Kubernetes Node Autoscaling", url: "https://karpenter.sh/docs/" },
      { title: "NVIDIA DCGM User Guide", url: "https://docs.nvidia.com/datacenter/dcgm/latest/user-guide/" },
      { title: "Kubernetes GPU Scheduling Best Practices", url: "https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/" },
    ],
  },

  // ─── LESSON 2: Terraform / Pulumi ───
  {
    lessonId: "terraform",
    trackId: "mlops-engineer",
    moduleId: "iac",
    objectives: [
      "Write Terraform configurations for VPCs, S3 buckets, and GPU clusters",
      "Manage state files securely with remote backends (S3 + DynamoDB)",
      "Create reusable modules for ML infrastructure components",
      "Implement Pulumi as a code-first alternative for complex infrastructure",
      "Deploy a complete drone AI training environment from scratch with IaC",
    ],
    prerequisites: [
      "Basic cloud computing concepts (VPC, subnets, security groups)",
      "AWS or GCP account with appropriate permissions",
      "Command-line experience with shell scripting",
    ],
    sections: [
      {
        id: "tf-intro",
        title: "Infrastructure as Code for ML Systems",
        type: "theory",
        content:
          "Drone AI infrastructure is complex: GPU clusters, object storage for datasets, container registries, networking, IAM policies, monitoring stacks. Setting this up manually through cloud consoles is slow, error-prone, and impossible to reproduce. When your training cluster fails at 3 AM, you need to recreate it identically in minutes, not hours.\n\nInfrastructure as Code (IaC) treats infrastructure configuration as software: version-controlled, reviewed, tested, and deployed automatically. Terraform (by HashiCorp) is the dominant IaC tool, using declarative HCL (HashiCorp Configuration Language) to define resources. You describe the desired state, and Terraform figures out how to get there.\n\nPulumi offers a code-first alternative where you write infrastructure in real programming languages (Python, TypeScript, Go). This is advantageous for ML teams who already know Python — you can use loops, conditionals, and abstractions that HCL makes awkward.\n\nFor drone AI platforms, IaC enables: (1) reproducible environments — spin up identical clusters for dev, staging, and production, (2) disaster recovery — recreate your entire infrastructure from code after an outage, (3) cost control — destroy expensive GPU clusters after training and recreate them when needed, (4) audit trails — every infrastructure change is a code commit with a review history.\n\nThe ML-specific challenge is managing large, expensive GPU instances alongside cheap storage and networking. A well-designed IaC setup lets you scale GPU resources independently, use spot instances for training, and maintain persistent storage for datasets and model artifacts.",
      },
      {
        id: "tf-vpc-gpu",
        title: "Terraform: VPC + GPU Cluster Infrastructure",
        type: "code",
        content:
          "This Terraform configuration creates a complete networking setup and an EKS cluster with GPU node groups for drone AI workloads. It follows AWS Well-Architected best practices with proper security groups, private subnets, and NAT gateways.",
        language: "bash",
        code: `# main.tf - Drone AI Infrastructure
terraform {
  required_version = ">= 1.8"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "drone-ai-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" { region = var.region }

# ── VPC with public/private subnets ──
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  name    = "drone-ai-vpc"
  cidr    = "10.0.0.0/16"
  azs             = ["us-west-2a", "us-west-2b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]
  enable_nat_gateway = true
  single_nat_gateway = true
  tags = { Project = "drone-ai", Environment = var.environment }
}

# ── S3 for datasets and model artifacts ──
resource "aws_s3_bucket" "datasets" {
  bucket = "drone-ai-datasets-\${var.environment}"
  tags   = { Project = "drone-ai" }
}

resource "aws_s3_bucket_versioning" "datasets" {
  bucket = aws_s3_bucket.datasets.id
  versioning_configuration { status = "Enabled" }
}

# ── EKS Cluster with GPU Node Groups ──
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"
  cluster_name    = "drone-ai-\${var.environment}"
  cluster_version = "1.30"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    # CPU nodes for control plane & light workloads
    cpu_general = {
      instance_types = ["m6i.xlarge"]
      min_size = 2, max_size = 5, desired_size = 2
    }
    # GPU nodes for training (use spot for cost savings)
    gpu_training = {
      instance_types = ["p3.2xlarge", "g5.2xlarge"]
      capacity_type  = "SPOT"
      min_size = 0, max_size = 8, desired_size = 0
      labels = { workload = "training", gpu = "true" }
      taints = [{ key = "nvidia.com/gpu", value = "true", effect = "NO_SCHEDULE" }]
    }
    # GPU nodes for inference (on-demand for reliability)
    gpu_inference = {
      instance_types = ["g5.xlarge"]
      capacity_type  = "ON_DEMAND"
      min_size = 1, max_size = 4, desired_size = 1
      labels = { workload = "inference", gpu = "true" }
    }
  }
}

# variables.tf
variable "region" { default = "us-west-2" }
variable "environment" { default = "dev" }

# outputs.tf
output "cluster_endpoint" { value = module.eks.cluster_endpoint }
output "dataset_bucket" { value = aws_s3_bucket.datasets.id }`,
      },
      {
        id: "tf-pulumi",
        title: "Pulumi: Python-based Infrastructure",
        type: "code",
        content:
          "For ML teams more comfortable with Python, Pulumi lets you write infrastructure in real Python code. Here's the same GPU cluster defined with Pulumi, showing how Python's expressiveness simplifies complex configurations.",
        language: "python",
        code: `import pulumi
import pulumi_aws as aws
import pulumi_eks as eks

config = pulumi.Config()
env = config.get("environment") or "dev"

# ── VPC ──
vpc = aws.ec2.Vpc(f"drone-ai-vpc-{env}",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    tags={"Project": "drone-ai", "Environment": env},
)

# Create subnets programmatically (Python advantage)
azs = ["us-west-2a", "us-west-2b"]
private_subnets = []
public_subnets = []

for i, az in enumerate(azs):
    private = aws.ec2.Subnet(f"private-{az}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=az,
        tags={"Name": f"private-{az}"},
    )
    private_subnets.append(private)

    public = aws.ec2.Subnet(f"public-{az}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+101}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={"Name": f"public-{az}"},
    )
    public_subnets.append(public)

# ── S3 Buckets ──
datasets = aws.s3.Bucket(f"drone-datasets-{env}",
    versioning=aws.s3.BucketVersioningArgs(enabled=True),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256",
            )
        )
    ),
)

# ── EKS Cluster ──
gpu_node_configs = {
    "training": {"instance": "p3.2xlarge", "spot": True, "min": 0, "max": 8},
    "inference": {"instance": "g5.xlarge", "spot": False, "min": 1, "max": 4},
}

cluster = eks.Cluster(f"drone-ai-{env}",
    vpc_id=vpc.id,
    private_subnet_ids=[s.id for s in private_subnets],
    instance_type="m6i.xlarge",
    desired_capacity=2,
    min_size=2, max_size=5,
)

# Add GPU node groups dynamically
for workload, cfg in gpu_node_configs.items():
    eks.ManagedNodeGroup(f"gpu-{workload}",
        cluster=cluster,
        instance_types=[cfg["instance"]],
        capacity_type="SPOT" if cfg["spot"] else "ON_DEMAND",
        scaling_config=aws.eks.NodeGroupScalingConfigArgs(
            min_size=cfg["min"], max_size=cfg["max"], desired_size=cfg["min"],
        ),
        labels={"workload": workload, "gpu": "true"},
    )

pulumi.export("cluster_endpoint", cluster.core.endpoint)
pulumi.export("dataset_bucket", datasets.id)`,
      },
      {
        id: "tf-exercise",
        title: "Lab: Build Drone AI Infrastructure from Code",
        type: "exercise",
        content:
          "Create a complete IaC project for a drone AI training and inference platform.\n\n**Task 1: State Backend**\nCreate an S3 bucket + DynamoDB table for Terraform state. Enable server-side encryption and versioning. Write the backend configuration.\n\n**Task 2: Network Layer**\nDefine a VPC with 2 public + 2 private subnets across 2 AZs. Add a NAT Gateway, Internet Gateway, and route tables. Security groups should allow: HTTPS inbound, all outbound, and inter-node communication.\n\n**Task 3: Storage Layer**\nCreate S3 buckets for: raw drone imagery, processed datasets, model artifacts, and training logs. Enable lifecycle policies to move old artifacts to Glacier after 90 days.\n\n**Task 4: Compute Layer**\nDefine an EKS cluster with CPU and GPU node groups. Use Terraform modules to make the configuration reusable. Parameterize instance types, scaling limits, and spot vs on-demand.\n\n**Task 5: Full Deployment**\nRun terraform plan and terraform apply to deploy the full stack. Verify resources are created correctly. Destroy everything with terraform destroy and verify no resources are leaked.",
      },
      {
        id: "tf-summary",
        title: "Summary & Key Takeaways",
        type: "summary",
        content:
          "Infrastructure as Code is non-negotiable for production ML systems. You've learned to define complete GPU infrastructure in Terraform and Pulumi, manage state safely, and build reusable modules.\n\nThe key pattern for drone AI infrastructure is separating persistent resources (VPC, S3, state) from ephemeral resources (GPU nodes, training jobs). Persistent resources should be in a separate Terraform state that rarely changes. Ephemeral GPU resources should scale to zero when not in use.\n\nNext: Kubeflow Pipelines, where you'll orchestrate ML workflows on the infrastructure you've just defined.",
      },
    ],
    keyTakeaways: [
      "Terraform uses declarative HCL; Pulumi uses real programming languages (Python, TypeScript)",
      "Remote state backends (S3 + DynamoDB) prevent state conflicts in team environments",
      "Separate persistent (VPC, S3) from ephemeral (GPU nodes) infrastructure",
      "Spot GPU instances save 60-70% on training costs; use on-demand for inference reliability",
      "IaC enables reproducible environments and disaster recovery for ML platforms",
    ],
    resources: [
      { title: "Terraform AWS Provider Documentation", url: "https://registry.terraform.io/providers/hashicorp/aws/latest/docs" },
      { title: "Pulumi AWS Getting Started", url: "https://www.pulumi.com/docs/clouds/aws/get-started/" },
      { title: "EKS Best Practices for ML Workloads", url: "https://aws.github.io/aws-eks-best-practices/machine-learning/" },
      { title: "Terraform Module Registry", url: "https://registry.terraform.io/" },
    ],
  },

  // ─── LESSON 3: Kubeflow Pipelines ───
  {
    lessonId: "kubeflow",
    trackId: "mlops-engineer",
    moduleId: "orchestration",
    objectives: [
      "Design modular ML pipeline components (Data Prep → Train → Evaluate → Deploy)",
      "Build and run Kubeflow Pipelines using the KFP v2 SDK in Python",
      "Implement pipeline caching, retries, and conditional logic",
      "Pass artifacts (datasets, models, metrics) between pipeline components",
      "Deploy automated retraining pipelines triggered by data/model drift",
    ],
    prerequisites: [
      "Kubernetes basics and kubectl usage",
      "Python decorators and function annotations",
      "Understanding of ML workflow stages (data prep, training, evaluation)",
    ],
    sections: [
      {
        id: "kfp-intro",
        title: "ML Pipeline Orchestration with Kubeflow",
        type: "theory",
        content:
          "An ML model's journey from raw data to production involves multiple stages: data ingestion, validation, preprocessing, feature engineering, training, evaluation, model registration, deployment, and monitoring. Doing this manually — running scripts in sequence, copying files between steps, checking results — is fragile and unreproducible.\n\nKubeflow Pipelines (KFP) orchestrates these stages as a Directed Acyclic Graph (DAG) of containerized components. Each component is an independent, reusable unit with defined inputs and outputs. The pipeline definition specifies how components connect — output of 'data prep' feeds into 'training', output of 'training' feeds into 'evaluation', etc.\n\nKFP v2 (the current version in 2026) uses a Python SDK where you write pipeline components as decorated Python functions. The framework handles containerization, orchestration, artifact tracking, caching, and UI visualization. You write Python functions; KFP turns them into a production ML workflow.\n\nFor drone AI platforms, KFP enables critical automation: (1) nightly retraining pipelines that ingest new drone imagery, retrain the detection model, evaluate against a benchmark, and auto-deploy if accuracy improves, (2) A/B testing pipelines that compare a new model against the production model on held-out data, (3) data quality pipelines that validate incoming sensor data before it enters the training set.\n\nThe ROI is significant. Manual ML workflows take hours of engineer time per iteration. Automated pipelines run in minutes, overnight, without human intervention. A drone AI team with automated pipelines can iterate 10× faster than one running scripts manually.",
      },
      {
        id: "kfp-components",
        title: "Building Pipeline Components with KFP v2",
        type: "code",
        content:
          "KFP v2 components are Python functions decorated with @component. Each component runs in its own container, receives typed inputs, and produces typed outputs. Artifacts (datasets, models, metrics) are tracked automatically.",
        language: "python",
        code: `from kfp import dsl
from kfp.dsl import Input, Output, Dataset, Model, Metrics, Artifact

# Component 1: Data Preparation
@dsl.component(
    base_image="python:3.11",
    packages_to_install=["pandas", "pyarrow", "boto3"],
)
def prepare_drone_data(
    raw_data_path: str,
    train_split: float,
    train_data: Output[Dataset],
    val_data: Output[Dataset],
    data_stats: Output[Metrics],
):
    """Download, validate, and split drone imagery dataset."""
    import pandas as pd
    from pathlib import Path
    import json

    # Download from S3 or local path
    df = pd.read_parquet(raw_data_path)

    # Data validation
    assert len(df) > 100, f"Too few samples: {len(df)}"
    assert "image_path" in df.columns, "Missing image_path column"
    assert "label" in df.columns, "Missing label column"

    # Split
    train_df = df.sample(frac=train_split, random_state=42)
    val_df = df.drop(train_df.index)

    # Save outputs
    train_df.to_parquet(train_data.path)
    val_df.to_parquet(val_data.path)

    # Log metrics
    data_stats.log_metric("total_samples", len(df))
    data_stats.log_metric("train_samples", len(train_df))
    data_stats.log_metric("val_samples", len(val_df))
    data_stats.log_metric("num_classes", df["label"].nunique())

# Component 2: Model Training
@dsl.component(
    base_image="pytorch/pytorch:2.5.0-cuda12.4-cudnn9-runtime",
    packages_to_install=["transformers", "timm", "wandb"],
)
def train_model(
    train_data: Input[Dataset],
    val_data: Input[Dataset],
    model_name: str,
    epochs: int,
    learning_rate: float,
    trained_model: Output[Model],
    training_metrics: Output[Metrics],
):
    """Fine-tune a vision model on drone imagery."""
    import torch
    from transformers import AutoModelForImageClassification

    # Load data
    import pandas as pd
    train_df = pd.read_parquet(train_data.path)
    val_df = pd.read_parquet(val_data.path)

    # ... training loop (abbreviated) ...
    # model = AutoModelForImageClassification.from_pretrained(model_name)
    # trainer.train()

    # Save model
    # model.save_pretrained(trained_model.path)
    trained_model.metadata["framework"] = "pytorch"
    trained_model.metadata["model_name"] = model_name

    # Log metrics
    training_metrics.log_metric("final_loss", 0.15)
    training_metrics.log_metric("val_accuracy", 0.94)
    training_metrics.log_metric("epochs_trained", epochs)

# Component 3: Evaluation Gate
@dsl.component(base_image="python:3.11", packages_to_install=["scikit-learn"])
def evaluate_model(
    trained_model: Input[Model],
    val_data: Input[Dataset],
    accuracy_threshold: float,
    eval_metrics: Output[Metrics],
) -> bool:
    """Evaluate model and return whether it meets deployment criteria."""
    # ... evaluation logic ...
    accuracy = 0.94  # from actual evaluation
    eval_metrics.log_metric("accuracy", accuracy)
    eval_metrics.log_metric("threshold", accuracy_threshold)
    return accuracy >= accuracy_threshold`,
      },
      {
        id: "kfp-pipeline",
        title: "Composing the Full Pipeline",
        type: "code",
        content:
          "Now we compose the components into a complete pipeline with conditional deployment logic. If the new model beats the accuracy threshold, it gets deployed automatically; otherwise, the pipeline ends with a notification.",
        language: "python",
        code: `from kfp import dsl, compiler

@dsl.pipeline(
    name="Drone AI Retraining Pipeline",
    description="Automated retraining pipeline for drone object detection",
)
def drone_retraining_pipeline(
    raw_data_path: str = "s3://drone-ai-datasets/latest/data.parquet",
    model_name: str = "google/vit-base-patch16-224",
    epochs: int = 20,
    learning_rate: float = 2e-5,
    accuracy_threshold: float = 0.92,
    train_split: float = 0.8,
):
    # Step 1: Prepare data
    data_prep = prepare_drone_data(
        raw_data_path=raw_data_path,
        train_split=train_split,
    ).set_caching_options(True)  # Cache if inputs haven't changed

    # Step 2: Train model
    training = train_model(
        train_data=data_prep.outputs["train_data"],
        val_data=data_prep.outputs["val_data"],
        model_name=model_name,
        epochs=epochs,
        learning_rate=learning_rate,
    ).set_cpu_limit("8").set_memory_limit("32Gi").set_gpu_limit("1")

    # Step 3: Evaluate
    evaluation = evaluate_model(
        trained_model=training.outputs["trained_model"],
        val_data=data_prep.outputs["val_data"],
        accuracy_threshold=accuracy_threshold,
    )

    # Step 4: Conditional deployment
    with dsl.If(evaluation.output == True):
        deploy = deploy_model(
            model=training.outputs["trained_model"],
            model_name="drone-detector",
            endpoint="production",
        )
    with dsl.Else():
        notify = send_notification(
            message="Model did not meet accuracy threshold. Review required.",
            channel="mlops-alerts",
        )

# Compile pipeline to YAML
compiler.Compiler().compile(
    pipeline_func=drone_retraining_pipeline,
    package_path="drone_pipeline.yaml",
)

# Submit pipeline run
from kfp.client import Client
client = Client(host="https://kubeflow.drone-ai.internal")
run = client.create_run_from_pipeline_package(
    "drone_pipeline.yaml",
    arguments={"raw_data_path": "s3://drone-ai-datasets/2026-03/data.parquet"},
    experiment_name="drone-retraining",
)`,
      },
      {
        id: "kfp-exercise",
        title: "Lab: Build a Drone Model Retraining Pipeline",
        type: "exercise",
        content:
          "Create a production-ready ML pipeline for continuous drone model improvement.\n\n**Task 1: Component Development**\nWrite 5 pipeline components: (a) data_download — fetches new drone imagery from S3, (b) data_validate — checks for corrupt images and label consistency, (c) train — fine-tunes a ViT model, (d) evaluate — computes mAP on a benchmark set, (e) deploy — pushes the model to a Triton Inference Server.\n\n**Task 2: Pipeline Composition**\nCompose the components into a DAG with proper data passing. Add conditional logic: only deploy if mAP > 0.85 AND mAP > current_production_model_mAP.\n\n**Task 3: Caching and Retries**\nEnable caching on the data_download and data_validate steps (these are slow but deterministic). Add retry policies to the train step (GPU OOM is recoverable with smaller batch size).\n\n**Task 4: Scheduled Runs**\nConfigure the pipeline to run automatically every night at 2 AM. Use a CronWorkflow or Kubeflow's recurring run feature.\n\n**Task 5: Pipeline Versioning**\nVersion your pipeline definition alongside your application code. Show how to roll back to a previous pipeline version if a new version introduces bugs.",
      },
      {
        id: "kfp-summary",
        title: "Summary & Key Takeaways",
        type: "summary",
        content:
          "Kubeflow Pipelines transforms ad-hoc ML scripts into reproducible, automated workflows. You've learned to build modular components, compose them into DAGs with conditional logic, and configure caching and resource requirements.\n\nThe key principle is 'pipelines as code' — your ML workflow is version-controlled, reviewed, and tested just like application code. This makes ML development reproducible and auditable, which is essential for regulated drone operations.\n\nNext: DVC (Data Version Control), where you'll learn to version the datasets that feed into these pipelines.",
      },
    ],
    keyTakeaways: [
      "KFP v2 components are decorated Python functions that run in isolated containers",
      "Artifacts (datasets, models, metrics) are passed between components with automatic tracking",
      "Pipeline caching skips unchanged steps, saving compute on iterative development",
      "Conditional logic (dsl.If/Else) enables automated deployment gates",
      "Scheduled pipelines enable nightly retraining without human intervention",
    ],
    resources: [
      { title: "Kubeflow Pipelines v2 SDK Documentation", url: "https://www.kubeflow.org/docs/components/pipelines/" },
      { title: "KFP Component Authoring Guide", url: "https://www.kubeflow.org/docs/components/pipelines/user-guides/components/" },
      { title: "ML Pipeline Best Practices (Google)", url: "https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning" },
    ],
  },

  // ─── LESSON 4: DVC (Data Version Control) ───
  {
    lessonId: "dvc",
    trackId: "mlops-engineer",
    moduleId: "orchestration",
    objectives: [
      "Version large datasets alongside code using DVC and Git",
      "Configure remote storage backends (S3, GCS, Azure Blob)",
      "Create reproducible data pipelines with dvc.yaml",
      "Track experiments with DVC and compare model performance across data versions",
      "Implement data lineage to link every model artifact to its exact training data",
    ],
    prerequisites: [
      "Git proficiency (branching, committing, pushing)",
      "Experience with large datasets (images, point clouds)",
      "Understanding of ML experiment tracking concepts",
    ],
    sections: [
      {
        id: "dvc-intro",
        title: "The Data Versioning Problem",
        type: "theory",
        content:
          "Git is the backbone of software version control, but it breaks down with large files. A single drone dataset can be 500GB+ of high-resolution imagery, LiDAR point clouds, and metadata. Git stores every version of every file, so committing a 500GB dataset twice would consume 1TB of Git history. This is impractical and makes cloning, pulling, and pushing impossibly slow.\n\nDVC (Data Version Control) solves this by decoupling data content from data metadata. The actual data files are stored in remote storage (S3, GCS, network drives), while Git tracks only small .dvc metafiles — essentially pointers containing the file hash, size, and remote location. When you 'switch' data versions (git checkout a different branch), DVC downloads the corresponding data files from remote storage.\n\nThis gives you the best of both worlds: Git's branching, tagging, and history for data, plus cloud storage's scalability and cost efficiency for actual file storage.\n\nFor drone AI, data versioning is critical because: (1) models are only as good as their training data — you must know exactly which data version produced which model, (2) drone imagery is collected iteratively (daily flights add new data), so datasets grow incrementally, (3) labeling corrections, augmentation changes, and data cleaning create new versions that must be tracked, (4) regulatory compliance may require proving which data was used to train a production model.\n\nDVC also provides pipeline management (dvc.yaml) for defining reproducible data processing steps, and experiment tracking for comparing model performance across different data versions and hyperparameter configurations.",
      },
      {
        id: "dvc-setup",
        title: "Setting Up DVC for Drone Datasets",
        type: "code",
        content:
          "Let's set up DVC for a drone imagery project, configure S3 as the remote storage, and track our first dataset. The key commands mirror Git's workflow: dvc init, dvc add, dvc push, dvc pull.",
        language: "bash",
        code: `# Initialize DVC in your Git repo
cd /workspace/drone-detection-project
dvc init
git add .dvc .dvcignore
git commit -m "Initialize DVC"

# Configure S3 as remote storage
dvc remote add -d storage s3://drone-ai-datasets/dvc-cache
dvc remote modify storage region us-west-2

# Optional: configure cloud credentials
# dvc remote modify --local storage access_key_id YOUR_KEY
# dvc remote modify --local storage secret_access_key YOUR_SECRET

git add .dvc/config
git commit -m "Configure DVC remote storage"

# ── Track a large dataset ──
# Assume we have 100GB of drone imagery
ls data/
# images/  (50,000 aerial images, 80GB)
# labels/  (COCO-format JSON annotations, 500MB)

dvc add data/images data/labels

# DVC creates .dvc metafiles (tiny pointers to actual data)
cat data/images.dvc
# outs:
# - md5: abc123...
#   size: 86000000000
#   nfiles: 50000
#   path: images

# Commit the metafiles to Git and push data to S3
git add data/images.dvc data/labels.dvc data/.gitignore
git commit -m "Track v1 drone dataset: 50K images, COCO annotations"
dvc push  # Uploads 80GB to S3

# ── Update dataset (add new flight data) ──
# Copy 5,000 new images from today's flight
cp /mnt/drone-sd-card/flight_042/*.jpg data/images/

# Re-track the updated dataset
dvc add data/images
git add data/images.dvc
git commit -m "Add flight 042 data: 55K total images"
dvc push  # Only uploads the 5K new images (deduplication!)

# ── Switch between versions ──
git log --oneline  # See data version history
git checkout HEAD~1 -- data/images.dvc  # Switch to previous version
dvc checkout  # Download the old data from S3

# ── Pull data on a new machinel ──
git clone https://github.com/team/drone-detection.git
cd drone-detection
dvc pull  # Downloads all tracked data from S3`,
      },
      {
        id: "dvc-pipelines",
        title: "Reproducible Data Pipelines with dvc.yaml",
        type: "code",
        content:
          "DVC pipelines define the data processing steps as a DAG. When you run dvc repro, DVC executes only the stages whose inputs or code have changed, skipping everything that's up-to-date. This makes iterative data processing fast and reproducible.",
        language: "bash",
        code: `# dvc.yaml - Drone data processing pipeline
stages:
  validate:
    cmd: python scripts/validate_images.py
    deps:
      - data/images
      - data/labels
      - scripts/validate_images.py
    outs:
      - data/validated/report.json
    metrics:
      - data/validated/report.json:
          cache: false

  preprocess:
    cmd: >
      python scripts/preprocess.py
      --input data/images
      --output data/processed
      --size 640
      --augment true
    deps:
      - data/images
      - data/labels
      - scripts/preprocess.py
      - data/validated/report.json
    outs:
      - data/processed

  split:
    cmd: >
      python scripts/split_dataset.py
      --input data/processed
      --train-ratio 0.8
      --val-ratio 0.1
      --test-ratio 0.1
    deps:
      - data/processed
      - scripts/split_dataset.py
    outs:
      - data/splits/train
      - data/splits/val
      - data/splits/test
    params:
      - split.train_ratio
      - split.val_ratio

  train:
    cmd: >
      python scripts/train.py
      --data data/splits
      --model vit-base
      --epochs 30
    deps:
      - data/splits/train
      - data/splits/val
      - scripts/train.py
    outs:
      - models/detector.pt
    metrics:
      - metrics/train_metrics.json:
          cache: false
    plots:
      - metrics/loss_curve.csv:
          x: epoch
          y: loss

  evaluate:
    cmd: python scripts/evaluate.py --model models/detector.pt --data data/splits/test
    deps:
      - models/detector.pt
      - data/splits/test
      - scripts/evaluate.py
    metrics:
      - metrics/eval_metrics.json:
          cache: false

# Run the full pipeline (only changed stages execute)
# $ dvc repro

# Compare metrics across experiments
# $ dvc metrics diff
# $ dvc plots diff`,
      },
      {
        id: "dvc-exercise",
        title: "Lab: Version a Growing Drone Dataset",
        type: "exercise",
        content:
          "Build a complete data versioning workflow for an iteratively growing drone imagery dataset.\n\n**Task 1: Initial Setup**\nInitialize a Git+DVC project. Configure S3 (or local remote) storage. Track an initial dataset of 1000+ drone images with annotations.\n\n**Task 2: Incremental Updates**\nSimulate 3 drone flights (adding 200, 300, 150 images respectively). After each flight, update the dataset with dvc add, commit, and push. Verify that each push only uploads new files.\n\n**Task 3: DVC Pipeline**\nWrite a dvc.yaml pipeline with stages: validate → preprocess → split → train → evaluate. Run dvc repro. Modify the preprocessing script and run again — verify only changed stages re-execute.\n\n**Task 4: Experiment Tracking**\nTrain 3 model variants using different data versions. Use dvc exp run with different parameters. Compare results with dvc metrics diff and dvc plots diff.\n\n**Task 5: Data Lineage Audit**\nFor a given model checkpoint, trace back: which version of the training data was used, what preprocessing was applied, and what hyperparameters were set. Document the complete lineage chain.",
      },
      {
        id: "dvc-summary",
        title: "Summary & Key Takeaways",
        type: "summary",
        content:
          "DVC bridges the gap between Git (for code) and cloud storage (for data), giving you version control for datasets of any size. The .dvc metafiles are lightweight pointers that Git tracks, while actual data lives in efficient remote storage with content-addressable deduplication.\n\nThe pipeline feature (dvc.yaml) makes data processing reproducible — any team member can run dvc repro to get identical results. Combined with experiment tracking, you can systematically compare how different data versions and parameters affect model performance.\n\nThis is essential for drone AI: you need to prove which data trained which model, comply with data governance requirements, and enable your team to collaborate on growing datasets without merge conflicts.",
      },
    ],
    keyTakeaways: [
      "DVC tracks large files via lightweight .dvc metafiles in Git + actual data in remote storage",
      "Content-addressable storage means only new/changed files are uploaded on dvc push",
      "dvc.yaml pipelines define reproducible data processing DAGs with automatic caching",
      "dvc repro re-executes only stages whose inputs or code have changed",
      "Data lineage links every model artifact to its exact training data version",
    ],
    resources: [
      { title: "DVC Official Documentation", url: "https://dvc.org/doc" },
      { title: "DVC Pipelines Tutorial", url: "https://dvc.org/doc/start/data-management/data-pipelines" },
      { title: "DVC Experiment Tracking", url: "https://dvc.org/doc/start/experiments" },
      { title: "DVC with S3 Remote Guide", url: "https://dvc.org/doc/user-guide/data-management/remote-storage/amazon-s3" },
    ],
  },

  // ─── LESSON 5: NVIDIA Triton Inference Server ───
  {
    lessonId: "triton",
    trackId: "mlops-engineer",
    moduleId: "serving",
    objectives: [
      "Deploy multi-framework models (PyTorch, ONNX, TensorRT) on Triton",
      "Configure Dynamic Batching for maximum GPU throughput",
      "Implement Model Ensembles for multi-stage inference pipelines",
      "Set up model versioning and A/B testing with Triton",
      "Benchmark inference performance under production-like load",
    ],
    prerequisites: [
      "Understanding of model inference (forward pass, batched inference)",
      "Experience with Docker and container orchestration",
      "ONNX export basics (from PyTorch or TensorFlow)",
    ],
    sections: [
      {
        id: "triton-intro",
        title: "Model Serving at Scale with Triton",
        type: "theory",
        content:
          "Serving ML models in production is fundamentally different from running inference in a Jupyter notebook. Production serving must handle: concurrent requests from multiple drones, variable input sizes, multiple model versions (A/B testing), hardware utilization optimization, health monitoring, and graceful scaling.\n\nNVIDIA Triton Inference Server is the industry standard for production model serving. It supports all major ML frameworks (PyTorch, TensorFlow, ONNX Runtime, TensorRT, OpenVINO), handles batching, scheduling, and GPU memory management automatically, and exposes gRPC and HTTP/REST APIs for inference.\n\nFor a drone fleet, Triton is the central inference hub: 100+ drones upload imagery to the ground station, Triton batches these requests for optimal GPU utilization, runs detection/classification models, and returns results within latency SLAs. A single Triton instance on 1 GPU can serve thousands of inference requests per second with dynamic batching.\n\nKey features for drone AI: (1) Dynamic Batching — accumulates individual requests into batches for GPU efficiency, (2) Model Ensembles — chain preprocessing → model → postprocessing as a single endpoint, (3) Model Versioning — serve multiple model versions simultaneously for A/B testing, (4) Concurrent Model Execution — run multiple models on the same GPU with configurable instance groups.\n\nTriton also supports edge deployment on Jetson, using the same configuration and API. This means your ground station and onboard inference can use the same model serving infrastructure, simplifying operations.",
      },
      {
        id: "triton-setup",
        title: "Deploying Models on Triton",
        type: "code",
        content:
          "Triton uses a model repository — a directory structure where each model has its config and versioned weights. Let's set up a repository with multiple models and start serving.",
        language: "bash",
        code: `# Model repository structure
mkdir -p model_repository/drone_detector/1
mkdir -p model_repository/thermal_classifier/1
mkdir -p model_repository/ensemble_pipeline/1

# ── Model 1: Drone Object Detector (TensorRT) ──
cat > model_repository/drone_detector/config.pbtxt << 'EOF'
name: "drone_detector"
platform: "tensorrt_plan"
max_batch_size: 32

input [{
  name: "input"
  data_type: TYPE_FP16
  dims: [3, 640, 640]
}]

output [{
  name: "detections"
  data_type: TYPE_FP32
  dims: [-1, 6]  # [x1,y1,x2,y2,score,class]
}]

# Dynamic batching: wait up to 10ms to form a batch
dynamic_batching {
  max_queue_delay_microseconds: 10000
  preferred_batch_size: [8, 16, 32]
}

# Run 2 instances on the same GPU for pipeline parallelism
instance_group [{
  count: 2
  kind: KIND_GPU
  gpus: [0]
}]

# Model versioning policy: serve latest 2 versions
version_policy { latest { num_versions: 2 } }
EOF

# Copy TensorRT engine to version directory
cp drone_detector.engine model_repository/drone_detector/1/model.plan

# ── Model 2: Thermal Classifier (ONNX) ──
cat > model_repository/thermal_classifier/config.pbtxt << 'EOF'
name: "thermal_classifier"
platform: "onnxruntime_onnx"
max_batch_size: 64

input [{
  name: "input"
  data_type: TYPE_FP32
  dims: [1, 224, 224]  # single-channel thermal
}]

output [{
  name: "probs"
  data_type: TYPE_FP32
  dims: [5]  # 5 thermal anomaly classes
}]

dynamic_batching {
  max_queue_delay_microseconds: 5000
}
EOF

cp thermal_classifier.onnx model_repository/thermal_classifier/1/model.onnx

# ── Launch Triton Server ──
docker run --gpus=all --rm -p 8000:8000 -p 8001:8001 -p 8002:8002 \\
  -v $(pwd)/model_repository:/models \\
  nvcr.io/nvidia/tritonserver:24.12-py3 \\
  tritonserver --model-repository=/models \\
  --log-verbose=1 \\
  --metrics-port=8002

# Verify models are loaded
curl localhost:8000/v2/health/ready  # Should return 200
curl localhost:8000/v2/models        # Lists all loaded models`,
      },
      {
        id: "triton-client",
        title: "Inference Client: Sending Requests to Triton",
        type: "code",
        content:
          "The Triton client library sends inference requests via gRPC (lower latency) or HTTP. This example shows how to send drone images for object detection with batched requests.",
        language: "python",
        code: `import tritonclient.grpc as grpcclient
import numpy as np
from PIL import Image
import time

class DroneInferenceClient:
    """Client for sending drone imagery to Triton for inference."""

    def __init__(self, url="localhost:8001"):
        self.client = grpcclient.InferenceServerClient(url=url)

    def detect_objects(self, images: list[np.ndarray], model_name="drone_detector"):
        """Run object detection on a batch of drone images."""
        # Preprocess: resize, normalize, stack into batch
        batch = np.stack([
            self._preprocess(img) for img in images
        ]).astype(np.float16)  # FP16 for TensorRT model

        # Create Triton input
        input_tensor = grpcclient.InferInput("input", batch.shape, "FP16")
        input_tensor.set_data_from_numpy(batch)

        # Create output request
        output = grpcclient.InferRequestedOutput("detections")

        # Send request
        start = time.perf_counter()
        result = self.client.infer(
            model_name=model_name,
            inputs=[input_tensor],
            outputs=[output],
        )
        latency_ms = (time.perf_counter() - start) * 1000

        # Parse results
        detections = result.as_numpy("detections")
        print(f"Batch of {len(images)}: {latency_ms:.1f}ms, {detections.shape}")
        return detections

    def _preprocess(self, image: np.ndarray) -> np.ndarray:
        """Resize and normalize image for model input."""
        from PIL import Image as PILImage
        img = PILImage.fromarray(image).resize((640, 640))
        arr = np.array(img).transpose(2, 0, 1).astype(np.float32) / 255.0
        return arr

    def check_health(self):
        """Check if Triton server is healthy."""
        return {
            "live": self.client.is_server_live(),
            "ready": self.client.is_server_ready(),
            "models": self.client.get_model_repository_index(),
        }

# Usage
client = DroneInferenceClient("triton.drone-ai.internal:8001")
print(client.check_health())

# Single image inference
# img = np.array(Image.open("drone_frame_001.jpg"))
# detections = client.detect_objects([img])

# Batch inference (much more efficient)
# batch = [np.array(Image.open(f)) for f in frame_paths[:32]]
# detections = client.detect_objects(batch)`,
      },
      {
        id: "triton-exercise",
        title: "Lab: Deploy a Multi-Model Drone AI Server",
        type: "exercise",
        content:
          "Build a production-grade Triton inference server for a drone fleet.\n\n**Task 1: Model Repository**\nCreate a model repository with 3 models: (a) an object detector (ONNX format), (b) a thermal classifier (ONNX format), (c) a preprocessing model (Python backend). Configure dynamic batching for each.\n\n**Task 2: Model Ensemble**\nCreate a Triton ensemble that chains: preprocess → detect → classify. A single API call should accept raw drone images and return both object detections and thermal classifications.\n\n**Task 3: Benchmarking**\nUse Triton's perf_analyzer tool to benchmark throughput and latency at different concurrency levels (1, 4, 16, 64 concurrent clients). Find the optimal concurrency that maximizes throughput within a 100ms latency SLA.\n\n**Task 4: A/B Testing**\nDeploy two versions of the detector model. Configure traffic splitting (80% to v1, 20% to v2). Compare accuracy metrics from both versions using Prometheus.\n\n**Task 5: Kubernetes Deployment**\nDeploy Triton on Kubernetes with horizontal pod autoscaling based on GPU utilization. Test that new Triton pods are created when load increases.",
      },
      {
        id: "triton-summary",
        title: "Summary & Key Takeaways",
        type: "summary",
        content:
          "Triton Inference Server is the bridge between model development and production serving. You've learned to deploy multi-framework models, configure dynamic batching for GPU efficiency, build model ensembles for multi-stage pipelines, and benchmark performance.\n\nDynamic batching is the single most impactful feature — it can increase throughput by 4-8× by accumulating individual requests into GPU-efficient batches. For a drone fleet sending imagery to a ground station, this means serving 100+ drones from a single GPU.\n\nNext: Observability & Drift Detection, where you'll monitor your deployed models for degrading performance.",
      },
    ],
    keyTakeaways: [
      "Triton serves any framework (PyTorch, ONNX, TensorRT) with a single unified API",
      "Dynamic batching accumulates requests for 4-8× throughput improvement",
      "Model ensembles chain preprocessing → model → postprocessing as one endpoint",
      "Model versioning enables safe A/B testing in production",
      "perf_analyzer is essential for finding optimal concurrency and batch size settings",
    ],
    resources: [
      { title: "NVIDIA Triton Inference Server Documentation", url: "https://docs.nvidia.com/deeplearning/triton-inference-server/" },
      { title: "Triton Model Configuration Guide", url: "https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/model_configuration.html" },
      { title: "Triton Client Libraries", url: "https://github.com/triton-inference-server/client" },
      { title: "Triton perf_analyzer Tutorial", url: "https://github.com/triton-inference-server/perf_analyzer" },
    ],
  },

  // ─── LESSON 6: Observability & Drift Detection ───
  {
    lessonId: "observability",
    trackId: "mlops-engineer",
    moduleId: "serving",
    objectives: [
      "Set up Prometheus and Grafana for ML model monitoring",
      "Monitor GPU hardware metrics (utilization, memory, temperature) via DCGM",
      "Implement model drift detection using Evidently AI",
      "Build alerting rules for accuracy degradation and data drift",
      "Create runbooks for common ML production incidents",
    ],
    prerequisites: [
      "Triton Inference Server lesson completed",
      "Basic understanding of metrics and monitoring concepts",
      "Familiarity with Prometheus query language (PromQL)",
    ],
    sections: [
      {
        id: "obs-intro",
        title: "ML Observability: Beyond Traditional Monitoring",
        type: "theory",
        content:
          "Traditional software monitoring asks: 'Is the server up? Is latency <100ms? Is error rate <0.1%?' ML monitoring adds a deeper question: 'Is the model still making good predictions?'\n\nA drone detection model can be perfectly 'healthy' from an infrastructure perspective — server running, latency within SLA, zero errors — while producing increasingly wrong predictions. This happens because: (1) the real-world data distribution shifts over time (seasonal changes, new camera hardware, different flight altitudes), (2) the relationships between features and targets change (concept drift), or (3) the upstream data pipeline starts producing corrupted or different inputs (data quality issues).\n\nML observability requires monitoring at three levels:\n\n**Infrastructure Level**: GPU utilization, memory, inference latency, throughput, error rates. This is what Prometheus/DCGM handle — the same metrics you'd monitor for any server.\n\n**Model Level**: Prediction distribution, confidence scores, feature distributions, input statistics. If the model suddenly starts predicting 'fire' for 40% of frames (vs the normal 2%), something is wrong — even if it hasn't technically 'errored.'\n\n**Data Level**: Input data quality, feature drift, schema changes, missing values. If the thermal camera starts sending all-black frames due to a hardware fault, the model will still run but predictions are meaningless.\n\nEvidently AI is the leading open-source tool for ML-level monitoring. It computes statistical tests between your reference (training) data distribution and incoming production data, flagging when distributions diverge beyond a threshold. Combined with Prometheus for infrastructure metrics and Grafana for visualization, you get comprehensive ML observability.",
      },
      {
        id: "obs-prometheus",
        title: "ML Metrics Pipeline with Prometheus",
        type: "code",
        content:
          "Set up a metrics pipeline that captures both infrastructure and model-level metrics. We expose custom Prometheus metrics from the inference service using the prometheus_client library.",
        language: "python",
        code: `from prometheus_client import (
    Counter, Histogram, Gauge, Summary, start_http_server
)
import time
import numpy as np

# ── Infrastructure Metrics ──
INFERENCE_REQUESTS = Counter(
    "drone_inference_requests_total",
    "Total inference requests",
    ["model_name", "model_version", "status"]
)

INFERENCE_LATENCY = Histogram(
    "drone_inference_latency_seconds",
    "Inference latency in seconds",
    ["model_name"],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]
)

BATCH_SIZE = Histogram(
    "drone_inference_batch_size",
    "Batch sizes for inference requests",
    ["model_name"],
    buckets=[1, 2, 4, 8, 16, 32, 64]
)

# ── Model-Level Metrics ──
PREDICTION_CONFIDENCE = Histogram(
    "drone_prediction_confidence",
    "Model confidence scores",
    ["model_name", "predicted_class"],
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99]
)

PREDICTION_DISTRIBUTION = Counter(
    "drone_predictions_by_class_total",
    "Count of predictions per class",
    ["model_name", "predicted_class"]
)

NUM_DETECTIONS = Histogram(
    "drone_detections_per_frame",
    "Number of detections per frame",
    ["model_name"],
    buckets=[0, 1, 2, 5, 10, 20, 50, 100]
)

# ── Instrumented inference function ──
def instrumented_inference(model, images, model_name="drone_detector"):
    """Run inference with full metric collection."""
    start = time.perf_counter()
    try:
        predictions = model.predict(images)
        latency = time.perf_counter() - start

        # Record metrics
        INFERENCE_REQUESTS.labels(model_name, "v1", "success").inc()
        INFERENCE_LATENCY.labels(model_name).observe(latency)
        BATCH_SIZE.labels(model_name).observe(len(images))

        # Record prediction-level metrics
        for pred in predictions:
            cls = pred["class"]
            conf = pred["confidence"]
            PREDICTION_CONFIDENCE.labels(model_name, cls).observe(conf)
            PREDICTION_DISTRIBUTION.labels(model_name, cls).inc()
            NUM_DETECTIONS.labels(model_name).observe(len(pred.get("boxes", [])))

        return predictions

    except Exception as e:
        INFERENCE_REQUESTS.labels(model_name, "v1", "error").inc()
        raise

# Start metrics server on port 9090
start_http_server(9090)`,
      },
      {
        id: "obs-evidently",
        title: "Model Drift Detection with Evidently AI",
        type: "code",
        content:
          "Evidently AI detects when production data diverges from the training distribution. We set up periodic drift checks that compare recent inference data against a reference dataset, triggering alerts when significant drift is detected.",
        language: "python",
        code: `from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import (
    DataDriftPreset, DataQualityPreset, TargetDriftPreset
)
from evidently.test_suite import TestSuite
from evidently.tests import (
    TestShareOfDriftedColumns,
    TestColumnDrift,
)
import pandas as pd
import json

def run_drift_check(reference_data: pd.DataFrame, production_data: pd.DataFrame):
    """Compare production data distribution against training reference."""

    column_mapping = ColumnMapping(
        prediction="prediction",
        numerical_features=["confidence", "bbox_area", "num_detections",
                           "brightness", "contrast", "altitude_m"],
        categorical_features=["predicted_class", "camera_type"],
    )

    # Generate drift report
    report = Report(metrics=[
        DataDriftPreset(stattest_threshold=0.05),  # p-value threshold
        DataQualityPreset(),
    ])
    report.run(
        reference_data=reference_data,
        current_data=production_data,
        column_mapping=column_mapping,
    )

    # Save HTML report
    report.save_html("drift_report.html")

    # Extract drift results as JSON for alerting
    results = report.as_dict()
    drift_detected = results["metrics"][0]["result"]["dataset_drift"]
    drifted_columns = [
        col for col, info in results["metrics"][0]["result"]["drift_by_columns"].items()
        if info["drift_detected"]
    ]

    return {
        "drift_detected": drift_detected,
        "drifted_columns": drifted_columns,
        "num_drifted": len(drifted_columns),
    }

# Automated test suite for CI/CD integration
def validate_data_quality(production_data: pd.DataFrame, reference_data: pd.DataFrame):
    """Run automated tests — fail if drift exceeds thresholds."""
    suite = TestSuite(tests=[
        TestShareOfDriftedColumns(lt=0.3),  # Less than 30% of columns drifted
        TestColumnDrift(column_name="confidence"),  # Confidence distribution stable
        TestColumnDrift(column_name="predicted_class"),  # Class distribution stable
    ])
    suite.run(reference_data=reference_data, current_data=production_data)

    results = suite.as_dict()
    all_passed = all(t["status"] == "SUCCESS" for t in results["tests"])

    if not all_passed:
        failed = [t for t in results["tests"] if t["status"] != "SUCCESS"]
        print(f"DRIFT ALERT: {len(failed)} tests failed!")
        # Trigger PagerDuty/Slack alert
        # send_alert(f"Model drift detected: {failed}")

    return all_passed`,
      },
      {
        id: "obs-exercise",
        title: "Lab: Build an ML Monitoring Dashboard",
        type: "exercise",
        content:
          "Build a comprehensive monitoring and alerting system for production drone AI.\n\n**Task 1: Metric Collection**\nInstrument an inference service with Prometheus metrics: request count, latency histogram, prediction confidence distribution, and detection count per frame. Verify metrics are exposed at /metrics endpoint.\n\n**Task 2: Grafana Dashboard**\nCreate a Grafana dashboard with panels for: (a) request rate and error rate, (b) p50/p95/p99 latency, (c) prediction class distribution over time, (d) confidence score distribution, (e) GPU utilization. Add time-series comparisons to spot trends.\n\n**Task 3: Drift Detection**\nSave a reference dataset from your training data. After deployment, collect 1 week of production inference data. Run Evidently drift detection. Generate an HTML report and interpret the results.\n\n**Task 4: Alerting Rules**\nConfigure Prometheus AlertManager rules for: (a) p99 latency > 200ms for 5 minutes, (b) error rate > 1% for 3 minutes, (c) prediction distribution shift > 20% from baseline, (d) GPU temperature > 85°C.\n\n**Task 5: Incident Runbook**\nWrite a runbook for: 'Model accuracy degradation detected.' Include steps to: diagnose the cause (data drift vs concept drift vs data quality), roll back to previous model version, trigger retraining pipeline, and post-incident review.",
      },
      {
        id: "obs-summary",
        title: "Summary & Key Takeaways",
        type: "summary",
        content:
          "ML observability goes far beyond 'is the server up?' You need to monitor at three levels: infrastructure (GPU, latency), model (predictions, confidence), and data (drift, quality). Prometheus + Grafana handle infrastructure; Evidently AI handles model and data drift.\n\nThe most dangerous failure mode in production ML is silent degradation — the model keeps running but accuracy drops because the data distribution shifted. Without drift detection, you won't know until a human notices wrong predictions, which could be days or weeks.\n\nWith this lesson, you've completed the MLOps track's serving and reliability module. You now have the full stack: containerized model serving (Triton), performance monitoring (Prometheus/Grafana), and drift detection (Evidently AI) — the foundation of reliable production drone AI.",
      },
    ],
    keyTakeaways: [
      "ML monitoring requires three levels: infrastructure, model predictions, and data quality",
      "Silent model degradation is the most dangerous failure — drift detection catches it early",
      "Evidently AI compares production data distributions against training reference data",
      "Custom Prometheus metrics for confidence scores and class distributions reveal model-level issues",
      "Automated drift tests can gate retraining pipelines and trigger alerts",
    ],
    resources: [
      { title: "Evidently AI Documentation", url: "https://docs.evidentlyai.com/" },
      { title: "Prometheus Monitoring for ML", url: "https://prometheus.io/docs/introduction/overview/" },
      { title: "Grafana ML Observability", url: "https://grafana.com/solutions/machine-learning/" },
      { title: "Google MLOps: Continuous Monitoring", url: "https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning" },
    ],
  },
];
