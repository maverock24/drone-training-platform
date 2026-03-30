# Lesson 3: INT4/INT8 Quantization for Edge Deployment

## Learning Objectives
- Apply INT8 and INT4 quantization for maximum compression
- Handle accuracy degradation with quantization-aware training
- Deploy INT4 models on Jetson edge devices

## INT8 Post-Training Quantization

```python
import torch
from torch.quantization import quantize_dynamic, quantize_fx
from torch.ao.quantization import get_default_qconfig_mapping, prepare_fx, convert_fx

# Method 1: Dynamic Quantization (simplest, CPU only)
model_int8_dynamic = quantize_dynamic(
    model, {torch.nn.Linear}, dtype=torch.qint8
)

# Method 2: Static Quantization with Calibration (better accuracy)
qconfig_mapping = get_default_qconfig_mapping("fbgemm")
example_inputs = (torch.randn(1, 3, 224, 224),)

prepared = prepare_fx(model, qconfig_mapping, example_inputs)

# Calibrate
with torch.no_grad():
    for images, _ in calib_loader:
        prepared(images)

model_int8_static = convert_fx(prepared)
```

## INT4 with GPTQ (for LLMs)

```python
from auto_gptq import AutoGPTQForCausalLM, BaseQuantizeConfig

# Configure INT4 quantization
quantize_config = BaseQuantizeConfig(
    bits=4,
    group_size=128,
    desc_act=True,
    sym=False,
)

# Load and quantize
model = AutoGPTQForCausalLM.from_pretrained(
    "meta-llama/Llama-3.1-8B",
    quantize_config=quantize_config,
)

# Provide calibration data
model.quantize(calibration_dataset)
model.save_quantized("./llama-3.1-8b-int4-gptq")
# Original: 16 GB → Quantized: 4 GB
```

## Quantization-Aware Training (QAT)

When PTQ causes >1% accuracy drop, use QAT — simulate quantization during training:

```python
import torch.ao.quantization as quant

class QATDroneViT(nn.Module):
    """ViT with quantization-aware training support."""
    
    def __init__(self, base_model):
        super().__init__()
        self.model = base_model
        self.quant = quant.QuantStub()
        self.dequant = quant.DeQuantStub()
    
    def forward(self, x):
        x = self.quant(x)
        x = self.model(x)
        x = self.dequant(x)
        return x

# QAT Training
model_qat = QATDroneViT(vit_base(num_classes=2))
model_qat.train()
model_qat.qconfig = quant.get_default_qat_qconfig('fbgemm')
quant.prepare_qat(model_qat, inplace=True)

# Train for a few epochs with simulated quantization
for epoch in range(5):
    for images, labels in train_loader:
        outputs = model_qat(images.cuda())
        loss = criterion(outputs, labels.cuda())
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

# Convert to truly quantized model
model_int8_qat = quant.convert(model_qat.eval())
```

## Deploying on Jetson with TensorRT

```python
import tensorrt as trt
import pycuda.driver as cuda

def export_onnx_to_trt(onnx_path, trt_path, precision="int8", calib_data=None):
    """Convert ONNX model to optimized TensorRT engine."""
    logger = trt.Logger(trt.Logger.WARNING)
    builder = trt.Builder(logger)
    network = builder.create_network(1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH))
    parser = trt.OnnxParser(network, logger)
    
    with open(onnx_path, 'rb') as f:
        parser.parse(f.read())
    
    config = builder.create_builder_config()
    config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, 1 << 30)
    
    if precision == "fp16":
        config.set_flag(trt.BuilderFlag.FP16)
    elif precision == "int8":
        config.set_flag(trt.BuilderFlag.INT8)
        config.int8_calibrator = DroneCalibrator(calib_data)
    
    engine = builder.build_serialized_network(network, config)
    
    with open(trt_path, 'wb') as f:
        f.write(engine)
    
    return trt_path

# Benchmark on Jetson
# FP32: 15 FPS → FP16: 35 FPS → INT8: 60 FPS → INT4: 90 FPS
```

## Hands-On Lab

### Exercise: Complete Quantization Pipeline
1. Start with a trained fire detection ViT (FP32, 93% accuracy)
2. Apply INT8 PTQ → measure accuracy and speed
3. If accuracy drops >1%, apply QAT for 5 epochs
4. Export to ONNX → TensorRT INT8 engine
5. Benchmark: FPS on simulated Jetson (or actual hardware)

Target: >55 FPS at >91% accuracy on Jetson Orin NX

## Key Takeaways

1. INT8 PTQ usually retains >99% accuracy for well-trained models
2. INT4 gives maximum compression (8×) but may need QAT
3. QAT simulates quantization during training, recovering lost accuracy
4. TensorRT is essential for maximum performance on NVIDIA hardware
5. Profile the full pipeline — not just the model — to find true bottlenecks
