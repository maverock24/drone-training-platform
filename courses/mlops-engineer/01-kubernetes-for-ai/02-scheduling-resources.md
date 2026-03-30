# Lesson 2: Scheduling and Resource Management

## Learning Objectives
- Configure priority classes and preemption for ML workloads
- Implement multi-tenancy for teams sharing GPU resources
- Handle GPU memory management and fractional GPU sharing

## Priority-Based Scheduling

Not all workloads are equal. Inference serving is critical; hyperparameter sweeps can wait.

```yaml
# priority-classes.yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: inference-critical
value: 1000000
globalDefault: false
description: "Production inference — never preempted"
preemptionPolicy: Never

---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: training-high
value: 100000
description: "Production model training"
preemptionPolicy: PreemptLowerPriority

---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: experiment-low
value: 1000
description: "Experimental runs — can be preempted"
preemptionPolicy: PreemptLowerPriority
```

## GPU Sharing with MIG and Time-Slicing

### Multi-Instance GPU (MIG) — Hardware Partitioning

```yaml
# mig-config.yaml for A100 80GB
# Split one A100 into multiple isolated GPU instances
apiVersion: v1
kind: ConfigMap
metadata:
  name: mig-config
data:
  config.yaml: |
    version: v1
    mig-configs:
      all-balanced:
        - devices: all
          mig-enabled: true
          mig-devices:
            "3g.40gb": 2   # Two 40GB instances for training
            "1g.10gb": 1   # One 10GB instance for inference
```

### Time-Slicing — Software Sharing

```yaml
# time-slicing-config.yaml
# Share a single GPU across multiple pods
apiVersion: v1
kind: ConfigMap
metadata:
  name: time-slicing-config
data:
  any: |-
    version: v1
    flags:
      migStrategy: none
    sharing:
      timeSlicing:
        renameByDefault: false
        failRequestsGreaterThanOne: false
        resources:
        - name: nvidia.com/gpu
          replicas: 4  # Each physical GPU appears as 4 virtual GPUs
```

## Resource Quotas for Team Management

```yaml
# team-quotas.yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ai-team-quota
  namespace: ai-team
spec:
  hard:
    requests.nvidia.com/gpu: "4"    # Max 4 GPUs requested
    limits.nvidia.com/gpu: "4"      # Max 4 GPUs allocated
    requests.memory: "128Gi"
    limits.memory: "256Gi"
    requests.cpu: "32"
    pods: "20"
```

## Hands-On Lab

### Exercise 1: Multi-Tenancy Setup
1. Create namespaces for `training`, `inference`, and `experiments`
2. Apply resource quotas to each namespace
3. Configure priority classes
4. Submit a low-priority experiment job, then a high-priority training job
5. Observe preemption behavior

### Exercise 2: GPU Sharing
1. Configure time-slicing with 4 replicas per GPU
2. Deploy 4 small inference models on a single GPU
3. Benchmark latency compared to dedicated GPU access
4. Determine when sharing is acceptable vs when dedicated access is needed

## Key Takeaways

1. Priority classes ensure critical inference always gets GPU access
2. MIG provides hardware-isolated GPU partitioning (A100/H100 only)
3. Time-slicing enables cost-effective GPU sharing for lightweight workloads
4. Resource quotas prevent any single team from monopolizing the cluster
5. Combine Karpenter auto-scaling with priority classes for optimal utilization
