# Lesson 3: Distributed Training on Kubernetes

## Learning Objectives
- Run multi-node distributed training with PyTorch DDP
- Use Kubeflow Training Operator for distributed jobs
- Handle checkpointing and fault tolerance

## Distributed Training Architecture

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Worker 0     │  │  Worker 1     │  │  Worker 2     │
│  (Rank 0)     │  │  (Rank 1)     │  │  (Rank 2)     │
│  GPU 0,1      │  │  GPU 0,1      │  │  GPU 0,1      │
│               │  │               │  │               │
│  Model Copy   │  │  Model Copy   │  │  Model Copy   │
│  Batch 0-63   │  │  Batch 64-127 │  │  Batch 128-191│
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                  │                  │
       └──────── AllReduce Gradients ────────┘
                          │
                 Synchronized Update
```

## Kubeflow Training Operator

```yaml
# distributed-training.yaml
apiVersion: kubeflow.org/v1
kind: PyTorchJob
metadata:
  name: fire-detection-distributed
  namespace: training
spec:
  pytorchReplicaSpecs:
    Master:
      replicas: 1
      restartPolicy: OnFailure
      template:
        spec:
          containers:
          - name: pytorch
            image: drone-ai/fire-trainer:v1.2
            command:
            - python
            - -m
            - torch.distributed.launch
            - --nproc_per_node=2
            - train_distributed.py
            - --epochs=100
            - --batch-size=128
            resources:
              limits:
                nvidia.com/gpu: 2
                memory: "64Gi"
            volumeMounts:
            - name: shared-data
              mountPath: /data
          volumes:
          - name: shared-data
            persistentVolumeClaim:
              claimName: training-data-pvc
    Worker:
      replicas: 3
      restartPolicy: OnFailure
      template:
        spec:
          containers:
          - name: pytorch
            image: drone-ai/fire-trainer:v1.2
            command:
            - python
            - -m
            - torch.distributed.launch
            - --nproc_per_node=2
            - train_distributed.py
            - --epochs=100
            - --batch-size=128
            resources:
              limits:
                nvidia.com/gpu: 2
                memory: "64Gi"
```

## Distributed Training Script

```python
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data.distributed import DistributedSampler
import os

def setup_distributed():
    dist.init_process_group(backend="nccl")
    local_rank = int(os.environ["LOCAL_RANK"])
    torch.cuda.set_device(local_rank)
    return local_rank

def train_distributed():
    local_rank = setup_distributed()
    rank = dist.get_rank()
    world_size = dist.get_world_size()
    
    # Model
    model = vit_base(num_classes=2).cuda(local_rank)
    model = DDP(model, device_ids=[local_rank])
    
    # Data with distributed sampler
    dataset = DroneFireDataset("/data/fire-dataset")
    sampler = DistributedSampler(dataset, num_replicas=world_size, rank=rank)
    loader = DataLoader(dataset, batch_size=64, sampler=sampler, num_workers=4)
    
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3 * world_size)
    
    for epoch in range(100):
        sampler.set_epoch(epoch)  # Shuffle differently each epoch
        model.train()
        
        for batch_idx, (images, labels) in enumerate(loader):
            images, labels = images.cuda(local_rank), labels.cuda(local_rank)
            
            loss = F.cross_entropy(model(images), labels)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
        
        # Save checkpoint (only rank 0)
        if rank == 0 and epoch % 10 == 0:
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.module.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
            }, f'/output/checkpoint_epoch_{epoch}.pth')
    
    dist.destroy_process_group()

if __name__ == "__main__":
    train_distributed()
```

## Hands-On Lab

### Exercise 1: Distributed Training
1. Containerize a drone model training script
2. Deploy a 2-worker PyTorchJob on Kubernetes
3. Verify gradient synchronization and checkpoint saving
4. Compare training time: 1 GPU vs 2 nodes × 2 GPUs

### Exercise 2: Fault Tolerance
1. Start a 3-worker distributed training job
2. Manually kill one worker pod during training
3. Verify the job restarts from the latest checkpoint
4. Implement elastic training that adjusts to available workers

## Key Takeaways

1. Kubeflow Training Operator simplifies distributed training on K8s
2. DistributedDataParallel (DDP) is the standard for multi-GPU training
3. Scale learning rate linearly with world size
4. Always checkpoint on rank 0 to avoid duplicate saves
5. Elastic training handles node failures gracefully

## Course Complete → Next Course: Infrastructure as Code
