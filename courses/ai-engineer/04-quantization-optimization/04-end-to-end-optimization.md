# Lesson 4: End-to-End Optimization Pipeline

## Learning Objectives
- Combine quantization, graph optimization, and hardware-specific tuning
- Benchmark complete inference pipelines (not just models)
- Build an optimization workflow for drone deployment

## The Full Optimization Stack

```
Trained Model (FP32, 344 MB, 15 FPS)
    │
    ├── 1. Torch Graph Optimization (torch.compile)
    │       → 25 FPS (+67%)
    ├── 2. Mixed Precision (FP16/BF16)
    │       → 35 FPS (+40%)
    ├── 3. Quantization (FP8 or INT8)
    │       → 55 FPS (+57%)
    ├── 4. TensorRT Compilation
    │       → 70 FPS (+27%)
    ├── 5. Operator Fusion & Graph Simplification
    │       → 80 FPS (+14%)
    └── 6. Input Pipeline Optimization
            → 90 FPS (+12%)
    
Final: 344 MB → 86 MB, 15 FPS → 90 FPS (6× speedup)
```

### Step-by-Step Implementation

```python
import torch
import torch.nn as nn
import onnx
import onnxruntime as ort
import numpy as np
import time

class DroneModelOptimizer:
    """End-to-end optimization pipeline for drone vision models."""
    
    def __init__(self, model, img_size=224, device='cuda'):
        self.model = model
        self.img_size = img_size
        self.device = device
    
    def step1_torch_compile(self):
        """Graph-level optimization using torch.compile."""
        self.model = torch.compile(
            self.model,
            mode="max-autotune",  # Maximum optimization
            fullgraph=True,       # Compile entire graph
        )
        return self
    
    def step2_export_onnx(self, path="model.onnx"):
        """Export to ONNX with optimization."""
        dummy = torch.randn(1, 3, self.img_size, self.img_size).to(self.device)
        
        torch.onnx.export(
            self.model,
            dummy,
            path,
            opset_version=18,
            input_names=['image'],
            output_names=['prediction'],
            dynamic_axes={'image': {0: 'batch'}},
        )
        
        # Optimize ONNX graph
        import onnxoptimizer
        model = onnx.load(path)
        optimized = onnxoptimizer.optimize(model, [
            'fuse_bn_into_conv',
            'fuse_consecutive_transposes',
            'eliminate_unused_initializer',
            'fuse_matmul_add_bias_into_gemm',
        ])
        onnx.save(optimized, path)
        return path
    
    def step3_onnxrt_optimize(self, onnx_path):
        """Create optimized ONNX Runtime session."""
        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
        
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess_options.enable_mem_pattern = True
        sess_options.enable_cpu_mem_arena = True
        
        session = ort.InferenceSession(onnx_path, sess_options, providers=providers)
        return session
    
    def benchmark(self, session_or_model, num_runs=100, batch_size=1):
        """Benchmark inference performance."""
        dummy = np.random.randn(batch_size, 3, self.img_size, self.img_size).astype(np.float32)
        
        # Warmup
        for _ in range(10):
            if isinstance(session_or_model, ort.InferenceSession):
                session_or_model.run(None, {'image': dummy})
            else:
                with torch.no_grad():
                    session_or_model(torch.from_numpy(dummy).cuda())
        
        # Benchmark
        times = []
        for _ in range(num_runs):
            start = time.perf_counter()
            if isinstance(session_or_model, ort.InferenceSession):
                session_or_model.run(None, {'image': dummy})
            else:
                with torch.no_grad():
                    session_or_model(torch.from_numpy(dummy).cuda())
                torch.cuda.synchronize()
            times.append(time.perf_counter() - start)
        
        mean_ms = np.mean(times) * 1000
        fps = 1000 / mean_ms * batch_size
        p99_ms = np.percentile(times, 99) * 1000
        
        print(f"Mean latency: {mean_ms:.1f} ms")
        print(f"P99 latency:  {p99_ms:.1f} ms")
        print(f"Throughput:   {fps:.0f} FPS")
        
        return {"mean_ms": mean_ms, "p99_ms": p99_ms, "fps": fps}
```

## Input Pipeline Optimization

The model is only part of the pipeline. Optimize data loading too:

```python
from torchvision.transforms import v2 as T
import torch.utils.data.datapipes as dp

class OptimizedDronePipeline:
    """GPU-accelerated input pipeline for drone image inference."""
    
    def __init__(self, img_size=224):
        # Use torchvision v2 transforms (GPU-accelerated)
        self.preprocess = T.Compose([
            T.ToImage(),
            T.ToDtype(torch.float32, scale=True),
            T.Resize(img_size, antialias=True),
            T.CenterCrop(img_size),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
    
    def process_batch(self, image_paths, device='cuda'):
        """Process a batch of images with GPU acceleration."""
        from torchvision.io import read_image
        
        batch = torch.stack([
            self.preprocess(read_image(p))
            for p in image_paths
        ])
        return batch.to(device, non_blocking=True)
```

## Hands-On Lab

### Capstone: Optimize a Drone Detection Pipeline
Start with an unoptimized detection pipeline running at 12 FPS. Apply each optimization step and measure:

| Step | Technique | Target FPS | Memory |
|------|-----------|-----------|--------|
| 0 | Baseline (FP32 PyTorch) | 12 | 344 MB |
| 1 | torch.compile | 20+ | 344 MB |
| 2 | FP16 mixed precision | 30+ | 172 MB |
| 3 | INT8 quantization | 50+ | 86 MB |
| 4 | TensorRT export | 65+ | 86 MB |
| 5 | Input pipeline optimization | 75+ | 86 MB |

**Deliverable:** A benchmarking report with charts showing each optimization's contribution.

## Key Takeaways

1. Optimization is cumulative — each step builds on the previous
2. Profile before optimizing to find the actual bottleneck
3. Input pipeline can be a hidden bottleneck — always optimize it too
4. P99 latency matters more than mean for safety-critical drone tasks
5. TensorRT provides the best performance on NVIDIA hardware

## Course Complete → Next Course: Knowledge Distillation
