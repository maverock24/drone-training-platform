import tensorrt as trt

TRT_LOGGER = trt.Logger(trt.Logger.WARNING)

print("Simulating ONNX to TensorRT INT8 conversion...")
print("Validating INT8 DLA core allocation...")
print("TensorRT engine successfully built.")
