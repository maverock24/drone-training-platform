# Lesson 2: FP8 Quantization

## Learning Objectives
- Implement FP8 post-training quantization (PTQ)
- Use NVIDIA's Model Optimizer for FP8 conversion
- Measure accuracy retention on drone vision models

## FP8: The 2026 Standard

FP8 (8-bit floating point) offers the best balance between compression and quality. Two formats exist:

- **E4M3** (4 exponent, 3 mantissa): Higher precision, used for weights and activations
- **E5M2** (5 exponent, 2 mantissa): Wider range, used for gradients

### Post-Training Quantization with NVIDIA Model Optimizer

```python
import modelopt.torch.quantization as mtq
import modelopt.torch.opt as mto

# Load your trained drone ViT
model = vit_base(num_classes=2)
model.load_state_dict(torch.load("best_drone_vit.pth"))
model.eval().cuda()

# Calibration dataset (representative subset of your training data)
calib_loader = get_calibration_loader(num_samples=512)

def calibrate(model):
    """Run calibration data through the model to collect statistics."""
    model.eval()
    with torch.no_grad():
        for images, _ in calib_loader:
            model(images.cuda())

# Quantize to FP8
config = mtq.FP8_DEFAULT_CFG  # E4M3 for weights, E4M3 for activations
mtq.quantize(model, config, forward_loop=calibrate)

# Evaluate quantized model
fp8_accuracy = evaluate(model, test_loader, 'cuda')
print(f"FP8 Accuracy: {fp8_accuracy:.2%}")  # Typically within 0.5% of FP32
```

### Manual FP8 Quantization (Understanding the Process)

```python
import torch

class FP8Quantizer:
    """Manual FP8-E4M3 quantization for educational purposes."""
    
    @staticmethod
    def quantize_tensor(tensor, scale=None):
        """Quantize FP32 tensor to FP8-E4M3 equivalent."""
        if scale is None:
            # Per-tensor scaling: map tensor range to FP8 range
            abs_max = tensor.abs().max()
            fp8_max = 448.0  # Max value for E4M3
            scale = fp8_max / abs_max.clamp(min=1e-12)
        
        # Scale → clamp to FP8 range → round
        scaled = tensor * scale
        quantized = scaled.clamp(-448.0, 448.0)
        # Simulate reduced precision by rounding to nearest FP8 value
        quantized = torch.round(quantized * 8) / 8  # 3 mantissa bits = 8 steps
        
        return quantized, scale
    
    @staticmethod
    def dequantize_tensor(quantized, scale):
        return quantized / scale
    
    @staticmethod
    def quantize_model(model, calib_data):
        """Quantize all linear layers using calibration data."""
        # Collect activation ranges
        activation_ranges = {}
        hooks = []
        
        def make_hook(name):
            def hook_fn(module, input, output):
                if name not in activation_ranges:
                    activation_ranges[name] = {"min": float('inf'), "max": float('-inf')}
                activation_ranges[name]["min"] = min(
                    activation_ranges[name]["min"], output.min().item()
                )
                activation_ranges[name]["max"] = max(
                    activation_ranges[name]["max"], output.max().item()
                )
            return hook_fn
        
        for name, module in model.named_modules():
            if isinstance(module, torch.nn.Linear):
                hooks.append(module.register_forward_hook(make_hook(name)))
        
        # Calibration pass
        model.eval()
        with torch.no_grad():
            for batch in calib_data:
                model(batch.cuda())
        
        for h in hooks:
            h.remove()
        
        # Quantize weights using collected ranges
        for name, module in model.named_modules():
            if isinstance(module, torch.nn.Linear):
                q_weight, scale = FP8Quantizer.quantize_tensor(module.weight.data)
                module.weight.data = FP8Quantizer.dequantize_tensor(q_weight, scale)
        
        return model
```

## Exporting to TensorRT with FP8

```python
import torch_tensorrt

# Export quantized model to TensorRT for maximum inference speed
model_fp8 = model  # Already quantized with modelopt
dummy_input = torch.randn(1, 3, 224, 224).cuda()

# Compile with TensorRT
trt_model = torch_tensorrt.compile(
    model_fp8,
    inputs=[torch_tensorrt.Input(shape=(1, 3, 224, 224), dtype=torch.float8_e4m3fn)],
    enabled_precisions={torch.float8_e4m3fn, torch.float16},
    workspace_size=1 << 30,  # 1 GB workspace
)

# Benchmark
import time
times = []
for _ in range(100):
    start = time.perf_counter()
    with torch.no_grad():
        _ = trt_model(dummy_input)
    torch.cuda.synchronize()
    times.append(time.perf_counter() - start)

print(f"FP8 TensorRT Latency: {np.mean(times[10:])*1000:.1f} ms")
```

## Hands-On Lab

### Exercise 1: FP8 Quantization Pipeline
1. Train a fire detection ViT to >92% accuracy
2. Apply FP8 PTQ using NVIDIA Model Optimizer
3. Measure accuracy drop (target: <0.5%)
4. Compare inference latency: FP32 vs FP16 vs FP8

### Exercise 2: Calibration Data Impact
1. Quantize the same model with 32, 128, 512, and 2048 calibration samples
2. Plot calibration size vs quantized accuracy
3. Find the minimum calibration samples needed for <1% accuracy drop

## Key Takeaways

1. FP8 E4M3 is optimal for weights and activations in inference
2. Calibration with 512+ representative samples is usually sufficient
3. NVIDIA Model Optimizer provides production-ready FP8 quantization
4. TensorRT compilation adds further speedup on top of FP8
5. Typical accuracy drop is <0.5% vs FP32 for well-calibrated models

## Next Lesson → INT4 Quantization with NVIDIA Model Optimizer
