#!/usr/bin/env python3
"""
Enriches drone_training.json:
  1. Expands thin lesson explanations
  2. Fills in thin step code blocks with real, runnable examples
  3. Adds two new lessons:
       - Edge AI: "TensorRT Optimization & Deployment Pipeline"
       - MLOps:   "CI/CD for Machine Learning Models"
"""

import json, copy

SRC = "/home/maverock24/drone-training-platform/courses/drone_training.json"

with open(SRC) as f:
    data = json.load(f)

# ──────────────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────────────

def find_lesson(track_name_substr, lesson_title_substr):
    for t in data["tracks"]:
        if track_name_substr.lower() in t["name"].lower():
            for l in t["lessons"]:
                if lesson_title_substr.lower() in l["title"].lower():
                    return l
    return None

def find_track(track_name_substr):
    for t in data["tracks"]:
        if track_name_substr.lower() in t["name"].lower():
            return t
    return None

def patch_step(lesson, step_num, new_code):
    for s in lesson["step_by_step_guide"]:
        if s["step"] == step_num:
            s["code"] = new_code
            return
    raise ValueError(f"Step {step_num} not found in lesson {lesson['title']}")

# ──────────────────────────────────────────────────────────────────────
# 1. EXPAND THIN EXPLANATIONS
# ──────────────────────────────────────────────────────────────────────

expansions = {

    ("edge", "on-device"): """The NVIDIA Jetson Orin Nano is a compact System-on-Module (SoM) designed specifically for edge AI workloads. It pairs a 6-core ARM Cortex-A78AE CPU with a 1024-core Ampere GPU and 8 GB of LPDDR5 RAM in a 10-watt thermal envelope. For drone applications, this translates to real-time inference at 30+ FPS for YOLOv8-class object detection models without requiring a tethered cloud connection.

JetPack SDK bundles everything you need: CUDA 12.x for general-purpose GPU programming, cuDNN for deep learning primitives, TensorRT for model optimization, and DeepStream SDK for building end-to-end video analytics pipelines. Understanding how these components interact is essential for squeezing maximum performance out of the hardware.

CUDA lets you write kernels — functions that run on thousands of GPU threads in parallel. For image pre-processing tasks like undistortion, colour-space conversion, or resizing, a custom CUDA kernel can be 10–50× faster than a CPU implementation. The key concepts are: thread blocks (groups of up to 1024 threads), grid dimensions (how many blocks to launch), and shared memory (fast per-block cache). Writing even a simple undistortion kernel teaches you the SIMT execution model that underpins all GPU acceleration.

DeepStream abstracts away the low-level pipeline management: it handles frame decoding (NvDec hardware unit), batching, running a TensorRT inference engine, and encoding the output stream (NvEnc), all on the GPU without any CPU copies. A DeepStream pipeline is defined in a GStreamer-compatible config file, making it straightforward to swap models or adjust resolutions.

For a drone processing a 4K video stream and running detection, the critical path is: NvDec → resize → TensorRT inference → tracker → result publish. On a Jetson Orin Nano, this pipeline can sustain 30 FPS with a YOLOv8-Small model, leaving CPU headroom for ROS 2 nodes and telemetry processing.""",

    ("edge", "robotics middleware"): """ROS 2 (Robot Operating System 2) is the de-facto middleware for autonomous robots in 2026. Unlike its predecessor, ROS 2 is built on DDS (Data Distribution Service), which provides real-time, peer-to-peer communication without a central master process. This makes it far more suitable for safety-critical drone applications.

The core primitives are: **nodes** (individual software processes), **topics** (typed publish/subscribe channels, e.g. `/camera/image_raw`), **services** (synchronous request/response), and **actions** (long-running tasks with feedback, e.g. `NavigateToPose`). ROS 2 uses `colcon` as its build system and supports Python (rclpy) and C++ (rclcpp) clients.

MAVROS is a ROS 2 package that acts as a bridge between the MAVLink protocol (used by Pixhawk and ArduPilot) and the ROS 2 ecosystem. It subscribes to autopilot telemetry — GPS position, IMU, battery voltage, flight mode — and publishes it as standard ROS 2 topics. It also provides services to set the flight mode (GUIDED, LOITER, AUTO) and actions to arm/disarm the vehicle. By publishing to `/mavros/setpoint_velocity/cmd_vel`, you can send velocity commands directly from your AI node to the flight controller.

Micro-ROS extends the ROS 2 graph to microcontrollers (e.g., STM32) running FreeRTOS. A micro-ROS node running on the ESC controller can publish per-motor RPM directly into the ROS 2 graph, giving you fine-grained observability. This stack — Jetson running ROS 2 ↔ Pixhawk via MAVROS ↔ optional micro-ROS on peripheral MCUs — is the backbone of every production autonomous drone stack in 2026.""",

    ("edge", "optimization"): """Hardware-in-the-Loop (HIL) testing is the gold standard for validating drone software before real-world flight. In HIL, the actual flight controller (Pixhawk) runs its full firmware and thinks it is flying, but instead of receiving signals from real sensors, it receives simulated sensor data injected by a simulation environment. The physics simulation computes forces, moments, and sensor readings; the real FC computes actuator outputs, which feed back into the simulation. This closed loop lets you detect bugs — PID tuning errors, timing issues, fail-safe triggers — without risking hardware damage.

NVIDIA Isaac Sim provides a physically accurate simulation environment with ROS 2 native integration. It models sensor noise for cameras and IMUs, simulates wind disturbances, and can render photorealistic imagery for computer vision validation. Crucially, it supports Hardware-in-the-Loop with a real Jetson Orin: the simulated camera feed is published as a ROS 2 topic, your detection model on the Jetson processes it, and sends velocity commands back to the simulated drone.

Latency profiling with NVIDIA Nsight Systems reveals the end-to-end timing of your pipeline. Nsight captures CUDA kernel launches, CPU–GPU memory transfers, and ROS 2 publish/subscribe delays on a unified timeline. For a drone making obstacle-avoidance decisions, the critical metric is total loop latency: from camera frame capture to flight controller command. Typical targets are <100 ms for obstacle avoidance and <50 ms for precision landing. Nsight helps you locate the dominant bottleneck — usually either the TensorRT inference or the MAVROS command round-trip — so you can optimise it directly.""",

    ("mlops", "model serving"): """NVIDIA Triton Inference Server transforms a trained model file into a production-grade HTTP/gRPC inference endpoint that scales horizontally on Kubernetes. Triton natively supports PyTorch TorchScript, ONNX Runtime, TensorRT Plan files, TensorFlow SavedModels, and custom Python backends — meaning you can serve models from any framework through a single unified API.

Dynamic batching is Triton's most impactful feature for throughput: instead of processing each request as it arrives, Triton accumulates requests over a configurable window (e.g., 2 ms) and batches them together for a single GPU kernel launch. For a model that processes individual images, this can improve GPU utilisation from 20% to 90% under moderate load, dramatically reducing cost per inference.

Observability is non-negotiable for production ML systems. Prometheus scrapes Triton's built-in `/metrics` endpoint, collecting per-model statistics: inference count, queue time, compute time, and GPU memory usage. Grafana dashboards surface these metrics in real time. Alongside infrastructure metrics, you need model-level monitoring: Evidently AI computes feature drift scores by comparing the distribution of incoming data against your training reference dataset. When drift exceeds a threshold — for example, a fire detection model suddenly receiving night-vision images it was not trained on — an alert triggers a retraining pipeline. This combination of infrastructure observability and model health monitoring is the foundation of a reliable MLOps practice.""",

    ("mlops", "workflow"): """ML pipelines must be modular, reproducible, and auditable. Kubeflow Pipelines (KFP) v2 lets you define each stage — data ingestion, preprocessing, training, evaluation, push-to-registry — as an independent containerised component. Components communicate through typed artifacts: a training component outputs a `Model` artifact; an evaluation component reads that artifact and outputs a `Metrics` artifact. The DAG of components is defined in Python using the `@component` and `@pipeline` decorator syntax, then compiled to an Argo Workflow YAML that runs on Kubernetes.

Data Version Control (DVC) solves the orthogonal problem of versioning large binary artifacts. A DVC-tracked dataset lives in cloud storage (S3, GCS) while Git stores a tiny `.dvc` pointer file. `dvc repro` re-runs any pipeline stage whose inputs have changed, maintaining a content-addressed cache to skip unchanged stages. `dvc push` and `dvc pull` synchronise artifacts between team members. Every model checkpoint is therefore linked to the exact commit and data version that produced it — making debugging regressions trivial.

Together, KFP and DVC give you full ML reproducibility: given a Git commit SHA, you can reconstruct the exact training data (`dvc checkout`), re-run the pipeline (`dvc repro`), and get a model that is bit-for-bit identical to the one in production. This is essential for regulated drone applications where flight software must be traceable to its training provenance.""",

    ("data", "sensor fusion"): """Sensor fusion is the art of combining imperfect, asynchronous data streams from multiple sensors to produce estimates that are more accurate than any individual sensor could provide. For a mapping drone, the core sensors are: a rolling-shutter RGB camera (high resolution, slow trigger rate ~2 Hz), a LiDAR unit (3D point cloud at 10–20 Hz), a dual-frequency GNSS receiver (position at 5–10 Hz with ±2 cm RTK accuracy), and a 9-DOF IMU (accelerometer + gyroscope + magnetometer at 200–400 Hz).

The fundamental challenge is time synchronisation. The IMU samples at 400 Hz, the camera triggers at 2 Hz, and the GPS fix arrives at 10 Hz — all on different hardware clocks. To geotag a camera frame, you interpolate the IMU/GPS trajectory to the precise camera trigger timestamp using a cubic spline or SLERP for rotations. Errors of even 5 ms in trigger time translate to 5–15 cm of position error at 10 m/s cruise speed, which degrades photogrammetric reconstruction quality.

LiDAR point cloud processing involves: voxel downsampling (reduce from 100K to 10K points per frame), statistical outlier removal (remove points >N standard deviations from local mean), and Iterative Closest Point (ICP) registration to align successive frames into a consistent 3D map. Libraries like Open3D and PDAL make these operations accessible in Python, while CUDA-accelerated versions (cuPCL) run in real time on the Jetson. The fusion of LiDAR-derived depth with camera-derived texture produces coloured 3D maps suitable for photogrammetric analysis, volumetric calculations, and obstacle detection.""",

    ("data", "labeling"): """Active learning dramatically reduces the human annotation cost of building computer vision datasets for drone applications, where labeling a single high-resolution aerial image can take 5–15 minutes. The core insight is that not all unlabelled images are equally informative: images the model already understands confidently add little value, while images on the model's decision boundary can substantially improve it.

The standard active learning cycle has four stages: (1) **train** an initial model on a small seed set (e.g., 500 labelled images); (2) **infer** on the full unlabelled pool and compute an uncertainty score for each image — common metrics are maximum softmax probability (lower = more uncertain), entropy of the predicted class distribution, and Monte Carlo Dropout variance; (3) **select** the top-N most uncertain images and send them to human annotators; (4) **retrain** on the expanded labelled set and repeat. After 3–5 cycles, you typically reach the same test accuracy as random sampling would require 5–10× more labels.

For drone inspection data, CVAT (Computer Vision Annotation Tool) is the recommended open-source labelling platform. It supports bounding boxes, polygons, polylines, and 3D cuboids, and can be self-hosted on a Kubernetes cluster. Labelbox offers a managed alternative with built-in active learning workflow integrations. Quality assurance is equally important: inter-annotator agreement (Cohen's kappa > 0.85 is the production bar) and automated consistency checks (duplicate frames, label drift over time) prevent silent dataset corruption from undermining model quality.""",

    ("ai", "sparsity"): """Pruning and sparsity represent a complementary approach to quantization for reducing model size and inference cost. Unlike quantization — which reduces the numerical precision of every weight — pruning reduces the count of non-zero weights, creating sparse neural networks that can be stored and computed more efficiently.

**Unstructured pruning** zeros out individual weights based on a magnitude criterion (the smallest |w| values are removed first). Applied iteratively — prune 10% → fine-tune → repeat — it can achieve 80–90% sparsity in transformer and CNN models with <2% accuracy loss. However, unstructured sparsity requires specialised sparse CUDA kernels (cuSPARSE, Ampere's structured sparsity hardware) to yield actual speedups; on dense hardware, a 90%-sparse matrix still takes the same compute as a dense one.

**Structured pruning** removes entire channels, attention heads, or transformer layers, producing a smaller dense model that runs faster on any hardware without specialised kernels. L1-norm channel pruning (remove channels whose filter weights have the smallest L1 magnitude) is the most common approach and is directly supported by PyTorch's `torch.nn.utils.prune` module.

**Lottery Ticket Hypothesis**: Frankle & Carlin (2019) showed that every large network contains a small "winning ticket" sub-network that can be trained in isolation to match the full network's accuracy. Finding these sub-networks via iterative magnitude pruning + rewinding is computationally expensive but produces the most compact models. For drone edge deployment where memory is at a premium (8 GB shared between CPU and GPU on the Jetson), pruning to 40–60% of original parameters before TensorRT export is a standard part of the model preparation pipeline.""",

}

# ──────────────────────────────────────────────────────────────────────
# Apply expansions
# ──────────────────────────────────────────────────────────────────────

for (track_key, lesson_key), new_exp in expansions.items():
    lesson = find_lesson(track_key, lesson_key)
    if lesson:
        lesson["detailed_explanation"] = new_exp.strip()
        print(f"Expanded: {lesson['title'][:50]}")
    else:
        print(f"WARNING: could not find lesson {track_key!r} / {lesson_key!r}")

# ──────────────────────────────────────────────────────────────────────
# 2. ENRICH THIN STEP CODE BLOCKS
# ──────────────────────────────────────────────────────────────────────

# --- AI Engineer: PEFT Step 1 ---
l = find_lesson("ai", "peft")
patch_step(l, 1, """\
# Install all dependencies for PEFT / QLoRA fine-tuning
pip install -U transformers>=4.40.0 \\
               peft>=0.10.0 \\
               bitsandbytes>=0.43.0 \\
               datasets>=2.19.0 \\
               accelerate>=0.29.0 \\
               trl>=0.8.6

# Verify CUDA is available inside the environment
python -c "import torch; print('CUDA:', torch.cuda.is_available(), '|', torch.version.cuda)"

# Login to Hugging Face Hub (needed for gated models like Llama-3)
huggingface-cli login
""")

# --- AI Engineer: Sparsity Step 1 ---
l = find_lesson("ai", "sparsity")
patch_step(l, 1, """\
import torch
import torchvision.models as models

# Load a pretrained MobileNetV3-Small as our baseline
model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
model.eval()

# Count total parameters and baseline size
total_params = sum(p.numel() for p in model.parameters())
print(f"Total parameters: {total_params:,}")
print(f"Model size: {total_params * 4 / 1024**2:.2f} MB (float32)")

# Evaluate baseline accuracy on a small batch (simulated here)
dummy_input = torch.randn(8, 3, 224, 224)
with torch.no_grad():
    output = model(dummy_input)
print("Output shape:", output.shape)  # (8, 1000)
""")

# --- AI Engineer: Sparsity Step 4 ---
patch_step(l, 4, """\
import torch
import torch.nn.utils.prune as prune
import os

def save_sparse_model(model, path: str):
    \"\"\"Save the pruned model, making sparsity permanent first.\"\"\"
    # Remove pruning re-parametrization so weights are truly sparse tensors
    for name, module in model.named_modules():
        if hasattr(module, "weight_mask"):            # pruned layer
            prune.remove(module, "weight")            # make permanent

    # Save state dict
    torch.save(model.state_dict(), path)
    size_mb = os.path.getsize(path) / 1024**2
    print(f"Saved: {path} ({size_mb:.2f} MB on disk)")

    # Count sparsity
    zeros = total = 0
    for p in model.parameters():
        zeros += (p == 0).sum().item()
        total += p.numel()
    print(f"Sparsity: {100 * zeros / total:.1f}% of weights are zero")

save_sparse_model(model, "pruned_model.pth")
""")

# --- MLOps: IaC Step 3 ---
l = find_lesson("mlops", "infrastructure as code")
patch_step(l, 3, """\
# 1. Initialise Terraform (downloads providers, sets up backend)
terraform init -upgrade

# 2. Preview the changes — review this carefully before applying!
terraform plan -out=tfplan.binary

# 3. Apply the plan (only the changes shown in plan)
terraform apply tfplan.binary

# 4. Verify resources were created
terraform state list

# 5. Optional: output key values (e.g., cluster endpoint)
terraform output -json

# ROLLBACK: destroy all managed resources if needed
# terraform destroy
""")

# --- Data Engineer: GeoAI Step 5 ---
l = find_lesson("data", "geospatial")
patch_step(l, 5, """\
# Install rio-cogeo
pip install rio-cogeo

# Convert to Cloud Optimized GeoTIFF with 4 overview levels and DEFLATE compression
rio cogeo create input.tif output_cog.tif \\
    --overview-level 4 \\
    --overview-resampling average \\
    --blocksize 512 \\
    --compress deflate

# Verify the file is a valid COG
rio cogeo validate output_cog.tif

# Inspect the overview structure
python3 - <<'EOF'
import rasterio
with rasterio.open("output_cog.tif") as src:
    print("CRS:", src.crs)
    print("Bounds:", src.bounds)
    print("Overview levels:", src.overviews(1))
    print("Block shapes:", [src.block_shapes[i] for i in range(src.count)])
EOF
""")

# --- Data Engineer: Active Learning Step 2 ---
l = find_lesson("data", "labeling")
patch_step(l, 2, """\
import numpy as np
from scipy.stats import entropy as scipy_entropy

def uncertainty_sampling(probs: np.ndarray, method: str = "entropy", top_n: int = 100):
    \"\"\"
    Select the most uncertain samples from model predictions.

    probs: (N, C) softmax probability array — N samples, C classes
    method: 'entropy' | 'least_confident' | 'margin'
    top_n: number of samples to select for labeling
    Returns: indices of the most uncertain samples (ascending = most uncertain first)
    \"\"\"
    if method == "entropy":
        # Shannon entropy — higher = more uncertain
        scores = scipy_entropy(probs, axis=1)
    elif method == "least_confident":
        # Distance from 1.0 for the most probable class
        scores = 1.0 - probs.max(axis=1)
    elif method == "margin":
        # Gap between top-2 predictions — smaller gap = more uncertain
        sorted_probs = np.sort(probs, axis=1)[:, ::-1]
        scores = 1.0 - (sorted_probs[:, 0] - sorted_probs[:, 1])
    else:
        raise ValueError(f"Unknown method: {method}")

    # Sort ascending and take the top_n most uncertain
    uncertain_indices = np.argsort(scores)[::-1][:top_n]
    return uncertain_indices, scores[uncertain_indices]

# Example usage  ─ replace with real model outputs
np.random.seed(42)
fake_probs = np.random.dirichlet(np.ones(5), size=10_000)   # 10k images, 5 classes
selected_idx, scores = uncertainty_sampling(fake_probs, method="entropy", top_n=100)

print(f"Selected {len(selected_idx)} images for labeling")
print(f"Mean entropy of selected: {scores.mean():.3f}")
print(f"First 5 selected image indices: {selected_idx[:5]}")
""")

# --- Edge AI: MAVROS Step 3 ---
l = find_lesson("edge", "robotics middleware")
patch_step(l, 3, """\
# 1. List available serial ports on the Jetson
ls -la /dev/tty{ACM,USB}* 2>/dev/null || ls /dev/ttyS*

# 2. Grant the current user persistent access (avoids sudo on every boot)
sudo usermod -aG dialout $USER
sudo usermod -aG tty $USER

# 3. Set correct permissions for this session
sudo chmod 666 /dev/ttyACM0

# 4. Verify Pixhawk is speaking MAVLink on the port (install mavproxy if needed)
pip3 install MAVProxy
mavproxy.py --master=/dev/ttyACM0 --baudrate=921600 --aircraft MyCopter

# 5. Configure MAVROS to use this port in the launch file:
# In px4.launch.py (ROS 2):
#   fcu_url = 'serial:///dev/ttyACM0:921600'

# 6. Launch MAVROS
ros2 launch mavros px4.launch.py fcu_url:=serial:///dev/ttyACM0:921600

# 7. Verify topics are publishing (in a second terminal)
ros2 topic list | grep mavros
ros2 topic echo /mavros/state --once
""")

# --- Edge AI: HIL Step 1 ---
l = find_lesson("edge", "optimization")
patch_step(l, 1, """\
# ──────────────────────────────────────────────────────────────────────
# NVIDIA Isaac Sim — Headless install via pip (Isaac Sim 4.x / 2025)
# Run on host PC or cloud VM with NVIDIA RTX GPU
# ──────────────────────────────────────────────────────────────────────

# 1. Create a dedicated conda environment
conda create -n isaaclab python=3.10 -y
conda activate isaaclab

# 2. Install Isaac Lab (wraps Isaac Sim, manages assets and physics)
pip install isaacsim-rl isaacsim-replicator isaacsim-robot-motion

# 3. Accept NVIDIA license and download Isaac Sim components
python -m isaacsim.asset.fetch

# 4. Verify GPU is visible to Isaac Sim
python -c "
from isaacsim import SimulationApp
app = SimulationApp({'headless': True})
import omni
print('Isaac Sim started. USD stage:', omni.usd.get_context().get_stage())
app.close()
"

# 5. (Optional) Install ROS 2 bridge for HIL
pip install isaacsim-ros2-bridge
""")

# --- Edge AI: HIL Step 2 ---
patch_step(l, 2, """\
# spawn_drone_hil.py — programmatically spawn a quadcopter in Isaac Sim
from isaacsim import SimulationApp
app = SimulationApp({"headless": False, "width": 1280, "height": 720})

import omni
import omni.isaac.core.utils.stage as stage_utils
from omni.isaac.quadruped.robots import Quadrotor   # or use a custom USD

# Open an empty stage and set physics
stage_utils.create_new_stage()
omni.kit.commands.execute("AddPhysicsScene",
    path="/World/PhysicsScene",
    gravity_magnitude=9.81)

# Spawn the F450 quadrotor USD asset
DRONE_USD = "omniverse://localhost/NVIDIA/Assets/Robots/F450/f450.usd"
drone_prim_path = "/World/F450"
omni.kit.commands.execute("CreateReferenceCommand",
    path_to=drone_prim_path,
    asset_path=DRONE_USD)

# Add a camera sensor attached to the drone body
from omni.isaac.sensor import Camera
cam = Camera(
    prim_path=f"{drone_prim_path}/Body/FrontCamera",
    resolution=(1280, 720),
    frequency=30,
)
cam.initialize()

# Publish camera frames to ROS 2 topic /camera/image_raw
from omni.isaac.ros2_bridge import ROS2CameraHelper
ros2_cam = ROS2CameraHelper(cam, "/camera/image_raw")

# Run the simulation loop
for _ in range(300):    # 10 seconds at 30 Hz
    app.update()

app.close()
""")

# ──────────────────────────────────────────────────────────────────────
# 3. ADD NEW LESSON: Edge AI — TensorRT Optimization Pipeline
# ──────────────────────────────────────────────────────────────────────

tensorrt_lesson = {
    "id": "tensorrt-optimization",
    "title": "TensorRT Optimization & Deployment Pipeline",
    "detailed_explanation": """TensorRT is NVIDIA's inference optimization SDK. Given a trained model (from PyTorch, ONNX, or TensorFlow), TensorRT applies a sequence of graph-level and kernel-level optimizations to produce a serialized "Plan" file that runs exclusively on NVIDIA GPUs. On an Orin Nano, a YOLOv8-Small model that runs at 18 FPS in PyTorch typically reaches 55–75 FPS after TensorRT INT8 optimization — a 3–4× throughput improvement at half the memory bandwidth.

The optimization pipeline has four stages: (1) **Export** the PyTorch model to ONNX format, which provides a hardware-agnostic graph representation; (2) **Parse** the ONNX graph in TensorRT's NetworkDefinition API; (3) **Build** the engine — TensorRT's builder profiles available kernels, fuses layers (e.g., Conv+BN+ReLU → single fused op), selects best kernel implementations, and optionally calibrates for INT8 using a small representative dataset; (4) **Serialize** the engine to a `.plan` file that can be loaded in milliseconds at inference time.

INT8 calibration deserves special attention. Floating-point weights are quantized to 8-bit integers by determining the optimal scale factor for each tensor. TensorRT supports post-training quantization (PTQ) via a calibration dataset of ~500 representative images and quantization-aware training (QAT) for maximum accuracy retention. For drone fire detection, INT8 calibration on 500 forest and urban images typically degrades mAP by less than 0.3% while delivering 40% lower inference latency.

Dynamic shapes allow a single TensorRT engine to handle variable batch sizes and input resolutions at runtime, specified via `OptimizationProfile`. Setting min/optimal/max batch sizes — e.g., (1, 4, 16) — allows the engine to use the most efficient kernel for each batch size rather than compiling separate engines. This is essential for production drone systems where frame batch sizes vary with the detection pipeline's load.""",
    "step_by_step_guide": [
        {
            "step": 1,
            "title": "Install TensorRT and dependencies",
            "description": "Set up the TensorRT environment on a Jetson Orin (JetPack) or x86 dev machine.",
            "code": """\
# ── On Jetson (JetPack 6.x already includes TensorRT) ──────────────────
dpkg -l | grep -i tensorrt    # verify installation
python3 -c "import tensorrt as trt; print('TRT version:', trt.__version__)"

# ── On x86 dev machine ─────────────────────────────────────────────────
pip install tensorrt==10.0.1 --extra-index-url https://pypi.ngc.nvidia.com
pip install onnx onnxruntime-gpu onnxsim torch torchvision

# Also install polygraphy — NVIDIA's TRT debugging toolkit
pip install nvidia-pyindex
pip install polygraphy

# Verify GPU connectivity
python3 -c "
import tensorrt as trt
logger = trt.Logger(trt.Logger.WARNING)
builder = trt.Builder(logger)
print('Max batch size:', builder.max_batch_size)
print('Platform identifier:', builder.platform_has_fast_fp16, builder.platform_has_fast_int8)
"
"""
        },
        {
            "step": 2,
            "title": "Export PyTorch model to ONNX",
            "description": "Convert a trained YOLOv8 or custom model to ONNX with dynamic batch support.",
            "code": """\
from ultralytics import YOLO
import torch

# Load a fine-tuned YOLOv8 model
model = YOLO("runs/detect/fire_v1/weights/best.pt")

# Export to ONNX with dynamic batch axis
model.export(
    format="onnx",
    dynamic=True,          # dynamic batch size
    simplify=True,         # run onnxsim to simplify graph
    opset=17,              # ONNX opset (TRT 10 supports up to 17)
    imgsz=640,
    half=False,            # keep FP32 for calibration; INT8 handled by TRT
)

# Verify the ONNX model
import onnx, onnxruntime as ort
onnx_model = onnx.load("runs/detect/fire_v1/weights/best.onnx")
onnx.checker.check_model(onnx_model)
print("ONNX model is valid:", onnx_model.graph.name)

# Run a quick inference test
sess = ort.InferenceSession("runs/detect/fire_v1/weights/best.onnx",
                             providers=["CUDAExecutionProvider"])
import numpy as np
dummy = np.random.rand(1, 3, 640, 640).astype(np.float32)
outputs = sess.run(None, {sess.get_inputs()[0].name: dummy})
print("ONNX output shapes:", [o.shape for o in outputs])
"""
        },
        {
            "step": 3,
            "title": "Build TensorRT INT8 engine with calibration",
            "description": "Use Polygraphy to build an INT8 engine calibrated on real drone images.",
            "code": """\
# build_trt_engine.py
import polygraphy.backend.onnx as onnx_backend
from polygraphy.backend.trt import (
    TrtRunner,
    CreateConfig,
    EngineFromNetwork,
    NetworkFromOnnxPath,
    SaveEngine,
)
from polygraphy.backend.trt import Calibrator
from polygraphy.comparator import DataLoader
import numpy as np, glob, cv2, os

ONNX_PATH = "runs/detect/fire_v1/weights/best.onnx"
ENGINE_PATH = "fire_detector_int8.plan"
CALIBRATION_IMAGES = glob.glob("data/calibration_set/*.jpg")[:500]

def calibration_data_loader():
    for img_path in CALIBRATION_IMAGES:
        img = cv2.imread(img_path)
        img = cv2.resize(img, (640, 640))
        img = img[:, :, ::-1].transpose(2, 0, 1)   # BGR→RGB, HWC→CHW
        yield {"images": (img / 255.0).astype(np.float32)[np.newaxis]}

calibrator = Calibrator(
    data_loader=calibration_data_loader(),
    cache="calibration.cache",
)

build_engine = EngineFromNetwork(
    NetworkFromOnnxPath(ONNX_PATH),
    config=CreateConfig(
        int8=True,
        calibrator=calibrator,
        profiles=[{
            "images": {"min": (1, 3, 640, 640),
                       "opt": (4, 3, 640, 640),
                       "max": (16, 3, 640, 640)}
        }],
    ),
)

save_engine = SaveEngine(build_engine, path=ENGINE_PATH)

# Build + save (takes 3–15 min depending on hardware)
with TrtRunner(save_engine) as runner:
    print("Engine built successfully:", ENGINE_PATH)
    print(f"Engine size on disk: {os.path.getsize(ENGINE_PATH)/1024**2:.1f} MB")
"""
        },
        {
            "step": 4,
            "title": "Run TensorRT inference with pycuda",
            "description": "Load the .plan engine and benchmark inference latency on the Jetson.",
            "code": """\
import tensorrt as trt
import pycuda.driver as cuda
import pycuda.autoinit
import numpy as np, time, cv2

ENGINE_PATH = "fire_detector_int8.plan"

# ── Load engine ──────────────────────────────────────────────────────
logger = trt.Logger(trt.Logger.WARNING)
with open(ENGINE_PATH, "rb") as f, trt.Runtime(logger) as runtime:
    engine = runtime.deserialize_cuda_engine(f.read())

context = engine.create_execution_context()
context.set_input_shape("images", (1, 3, 640, 640))

# ── Allocate GPU buffers ─────────────────────────────────────────────
h_input  = np.zeros((1, 3, 640, 640), dtype=np.float32)
h_output = np.zeros((1, 300, 6),     dtype=np.float32)   # YOLOv8 output shape
d_input  = cuda.mem_alloc(h_input.nbytes)
d_output = cuda.mem_alloc(h_output.nbytes)
stream   = cuda.Stream()

def infer(img_np):
    \"\"\"Run one forward pass and return raw detections.\"\"\"
    np.copyto(h_input, img_np)
    cuda.memcpy_htod_async(d_input,  h_input,  stream)
    context.execute_async_v2([int(d_input), int(d_output)], stream.handle)
    cuda.memcpy_dtoh_async(h_output, d_output, stream)
    stream.synchronize()
    return h_output.copy()

# ── Benchmark ────────────────────────────────────────────────────────
dummy = np.random.rand(1, 3, 640, 640).astype(np.float32)
for _ in range(10):   # warm-up
    infer(dummy)

N_ITER = 200
t0 = time.perf_counter()
for _ in range(N_ITER):
    infer(dummy)
elapsed = time.perf_counter() - t0
print(f"Average latency: {elapsed/N_ITER*1000:.2f} ms")
print(f"Throughput:      {N_ITER/elapsed:.1f} FPS")
"""
        },
        {
            "step": 5,
            "title": "Integrate TensorRT engine into a ROS 2 detection node",
            "description": "Wrap the TRT engine in a ROS 2 node that subscribes to camera frames and publishes detections.",
            "code": """\
#!/usr/bin/env python3
# trt_detector_node.py
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from vision_msgs.msg import Detection2DArray, Detection2D, BoundingBox2D
from cv_bridge import CvBridge
import numpy as np, cv2, tensorrt as trt, pycuda.driver as cuda

class TRTDetectorNode(Node):
    def __init__(self):
        super().__init__("trt_detector")
        self.bridge = CvBridge()

        # Load TRT engine
        logger = trt.Logger(trt.Logger.WARNING)
        with open("fire_detector_int8.plan", "rb") as f, trt.Runtime(logger) as rt:
            self.engine = rt.deserialize_cuda_engine(f.read())
        self.ctx = self.engine.create_execution_context()
        self.ctx.set_input_shape("images", (1, 3, 640, 640))

        self.h_in  = np.zeros((1, 3, 640, 640), dtype=np.float32)
        self.h_out = np.zeros((1, 300, 6),       dtype=np.float32)
        self.d_in  = cuda.mem_alloc(self.h_in.nbytes)
        self.d_out = cuda.mem_alloc(self.h_out.nbytes)
        self.stream = cuda.Stream()

        self.sub = self.create_subscription(Image, "/camera/image_raw", self.cb, 10)
        self.pub = self.create_publisher(Detection2DArray, "/detections", 10)
        self.get_logger().info("TRT detector ready ✓")

    def preprocess(self, img_bgr):
        img = cv2.resize(img_bgr, (640, 640))
        img = img[:, :, ::-1].transpose(2, 0, 1).astype(np.float32) / 255.0
        return img[np.newaxis]

    def infer(self, img_np):
        np.copyto(self.h_in, img_np)
        cuda.memcpy_htod_async(self.d_in,  self.h_in,  self.stream)
        self.ctx.execute_async_v2([int(self.d_in), int(self.d_out)], self.stream.handle)
        cuda.memcpy_dtoh_async(self.h_out, self.d_out, self.stream)
        self.stream.synchronize()
        return self.h_out[0]   # (300, 6): x1, y1, x2, y2, score, class

    def cb(self, msg):
        frame = self.bridge.imgmsg_to_cv2(msg, "bgr8")
        preds = self.infer(self.preprocess(frame))

        out = Detection2DArray()
        out.header = msg.header
        for x1, y1, x2, y2, score, cls in preds:
            if score < 0.45:
                continue
            d = Detection2D()
            d.bbox.center.position.x = float((x1 + x2) / 2)
            d.bbox.center.position.y = float((y1 + y2) / 2)
            d.bbox.size_x = float(x2 - x1)
            d.bbox.size_y = float(y2 - y1)
            out.detections.append(d)
        self.pub.publish(out)

def main():
    cuda.init()
    rclpy.init()
    rclpy.spin(TRTDetectorNode())

if __name__ == "__main__":
    main()
"""
        },
    ],
    "quiz": [
        {
            "question": "What is the primary purpose of the TensorRT calibration dataset?",
            "options": [
                "To fine-tune the model weights for better accuracy",
                "To determine optimal INT8 scale factors for each tensor activation",
                "To augment the training set with synthetic data",
                "To measure GPU memory requirements before deployment"
            ],
            "answer": "To determine optimal INT8 scale factors for each tensor activation"
        },
        {
            "question": "Why must a PyTorch model be exported to ONNX before TensorRT optimization?",
            "options": [
                "TensorRT does not support Python APIs",
                "ONNX provides a hardware-agnostic graph that TensorRT can parse and optimize",
                "ONNX applies INT8 quantization automatically",
                "PyTorch models cannot run on Jetson hardware"
            ],
            "answer": "ONNX provides a hardware-agnostic graph that TensorRT can parse and optimize"
        },
        {
            "question": "What does TensorRT layer fusion (e.g., Conv+BN+ReLU) achieve?",
            "options": [
                "Reduces model accuracy to gain speed",
                "Removes redundant operations to reduce memory bandwidth and kernel launch overhead",
                "Splits large tensors across multiple GPUs",
                "Converts the model to run on the CPU"
            ],
            "answer": "Removes redundant operations to reduce memory bandwidth and kernel launch overhead"
        },
        {
            "question": "Which pycuda object represents a GPU memory allocation?",
            "options": ["cuda.Stream", "cuda.DeviceArray", "cuda.mem_alloc return value", "cuda.Context"],
            "answer": "cuda.mem_alloc return value"
        },
        {
            "question": "What does `execute_async_v2` do differently from `execute_v2`?",
            "options": [
                "It runs inference on the CPU instead of GPU",
                "It submits GPU work to a CUDA stream, allowing CPU to proceed without waiting",
                "It batches multiple inference requests automatically",
                "It runs the model in FP16 instead of INT8"
            ],
            "answer": "It submits GPU work to a CUDA stream, allowing CPU to proceed without waiting"
        },
        {
            "question": "What is the typical speedup of TensorRT INT8 over PyTorch FP32 for YOLOv8-Small on Jetson Orin Nano?",
            "options": ["1.1–1.5×", "3–4×", "10–20×", "50–100×"],
            "answer": "3–4×"
        },
        {
            "question": "In an OptimizationProfile, what does the 'opt' batch size represent?",
            "options": [
                "The maximum batch size the engine will ever process",
                "The batch size TensorRT optimizes kernels for (best performance point)",
                "The minimum batch size required to start the engine",
                "The calibration batch size for INT8 quantization"
            ],
            "answer": "The batch size TensorRT optimizes kernels for (best performance point)"
        },
        {
            "question": "Why is `stream.synchronize()` needed after `memcpy_dtoh_async`?",
            "options": [
                "To release GPU memory back to the allocator",
                "To ensure the asynchronous copy has completed before the CPU reads the result",
                "To reset the TensorRT execution context",
                "To flush Prometheus metrics to Grafana"
            ],
            "answer": "To ensure the asynchronous copy has completed before the CPU reads the result"
        },
        {
            "question": "What ROS 2 message type is used in the detection node to publish bounding boxes?",
            "options": [
                "sensor_msgs/BoundingBox",
                "vision_msgs/Detection2DArray",
                "std_msgs/Float32MultiArray",
                "geometry_msgs/PoseArray"
            ],
            "answer": "vision_msgs/Detection2DArray"
        },
        {
            "question": "Which Polygraphy class is responsible for INT8 calibration during engine build?",
            "options": ["CreateConfig", "Calibrator", "EngineFromNetwork", "DataLoader"],
            "answer": "Calibrator"
        },
    ]
}

# ──────────────────────────────────────────────────────────────────────
# 4. ADD NEW LESSON: MLOps — CI/CD for Machine Learning Models
# ──────────────────────────────────────────────────────────────────────

mlops_cicd_lesson = {
    "id": "mlops-cicd",
    "title": "CI/CD for Machine Learning Models",
    "detailed_explanation": """Continuous Integration and Continuous Delivery (CI/CD) for machine learning extends the software engineering principle of automating testing and deployment to the unique challenges of ML: datasets change, models drift, and a new training run that passes all unit tests may still produce a worse model than the one it replaces.

A robust ML CI/CD pipeline has three phases. **CI (Continuous Integration)**: when a developer pushes a code change or a new dataset version is tagged in DVC, the pipeline automatically runs data validation (schema checks, distribution checks with Great Expectations), re-trains the model on the new data, and evaluates it against a held-out test set. If evaluation metrics fall below thresholds — e.g., mAP < 0.78 — the pipeline fails and blocks deployment.

**CD (Continuous Delivery)**: a passing CI build automatically packages the model artifact (ONNX + TensorRT plan), updates the model version in MLflow Model Registry, and opens a pull request against the deployment configuration repository. A human reviews the PR, checks the evaluation report, and approves merge. This "human-in-the-loop" gate is standard for safety-critical drone applications.

**CD (Continuous Deployment)**: for low-stakes updates (e.g., improving NLP confidence thresholds), fully automated deployment with canary releases is possible. Triton Inference Server supports model versioning natively — new model versions are loaded alongside old ones; traffic is split 10%/90% new/old; metrics are monitored for 30 minutes; if latency and accuracy hold, traffic shifts 100% to the new version.

GitHub Actions and GitLab CI are the most common orchestrators for the code + data + model workflow. Each job runs in a Docker container with GPU access via NVIDIA Container Toolkit. The full pipeline — data pull, train, eval, package, push to registry — typically completes in 20–45 minutes for a YOLOv8-class model, making same-day iteration cycles practical.""",
    "step_by_step_guide": [
        {
            "step": 1,
            "title": "Set up GitHub Actions with GPU runner",
            "description": "Configure a self-hosted GitHub Actions runner on a machine with an NVIDIA GPU for ML CI/CD.",
            "code": """\
# 1. Register a self-hosted runner on your GPU machine
# (GitHub repo → Settings → Actions → Runners → New self-hosted runner)
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.316.1.tar.gz -L \\
  https://github.com/actions/runner/releases/download/v2.316.1/actions-runner-linux-x64-2.316.1.tar.gz
tar xzf ./actions-runner-linux-x64-2.316.1.tar.gz
./config.sh --url https://github.com/YOUR_ORG/drone-ai-model --token YOUR_RUNNER_TOKEN
./svc.sh install && ./svc.sh start   # run as a systemd service

# 2. Verify NVIDIA Container Toolkit is installed
nvidia-smi                            # GPU visible to host
docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi
"""
        },
        {
            "step": 2,
            "title": "Write the GitHub Actions CI workflow",
            "description": "Create a .github/workflows/ml_ci.yml that trains and evaluates the model on every push.",
            "code": """# .github/workflows/ml_ci.yml\nname: ML CI Pipeline\n\non:\n  push:\n    branches: [main, \"feature/**\"]\n  pull_request:\n    branches: [main]\n\njobs:\n  train-and-evaluate:\n    runs-on: self-hosted          # GPU machine\n    container:\n      image: nvcr.io/nvidia/pytorch:24.04-py3\n      options: --gpus all --ipc=host\n\n    steps:\n      - uses: actions/checkout@v4\n\n      - name: Pull dataset from DVC remote\n        run: |\n          pip install dvc[s3] && dvc pull data/train data/val\n\n      - name: Install dependencies\n        run: pip install -r requirements.txt\n\n      - name: Train model\n        run: |\n          python train.py \\\n            --data data/fire.yaml \\\n            --model yolov8s.pt \\\n            --epochs 50 \\\n            --batch 16 \\\n            --project runs/ci \\\n            --name latest\n        env:\n          WANDB_API_KEY: ${{ secrets.WANDB_API_KEY }}\n\n      - name: Evaluate on test set\n        run: |\n          python evaluate.py \\\n            --weights runs/ci/latest/weights/best.pt \\\n            --data data/fire.yaml \\\n            --task test \\\n            --min-map 0.78          # fail if below threshold\n\n      - name: Upload model artifact\n        uses: actions/upload-artifact@v4\n        with:\n          name: fire-detector-${{ github.sha }}\n          path: runs/ci/latest/weights/best.pt\n"""
        },
        {
            "step": 3,
            "title": "Validate data quality with Great Expectations",
            "description": "Add automated data validation before training to catch schema drift and label imbalance.",
            "code": """\
# data_validation.py — run this as the first CI step
import great_expectations as ge
import pandas as pd, yaml, sys
from pathlib import Path

def validate_dataset(data_yaml_path: str) -> bool:
    with open(data_yaml_path) as f:
        cfg = yaml.safe_load(f)

    errors = []
    for split in ["train", "val"]:
        img_dir = Path(cfg[split])
        label_dir = img_dir.parent.parent / "labels" / img_dir.name

        images = list(img_dir.glob("*.jpg")) + list(img_dir.glob("*.png"))
        labels = list(label_dir.glob("*.txt"))

        if len(images) == 0:
            errors.append(f"{split}: no images found in {img_dir}")
        if len(labels) == 0:
            errors.append(f"{split}: no labels found in {label_dir}")
        if abs(len(images) - len(labels)) > len(images) * 0.01:
            errors.append(f"{split}: image/label count mismatch: {len(images)} vs {len(labels)}")

        # Check class distribution
        class_counts = {}
        for lf in labels:
            for line in lf.read_text().splitlines():
                if line.strip():
                    cls = int(line.split()[0])
                    class_counts[cls] = class_counts.get(cls, 0) + 1

        # Warn if any class has < 50 samples
        for cls, count in class_counts.items():
            if count < 50:
                errors.append(f"{split}: class {cls} has only {count} samples (min=50)")

    if errors:
        print("DATA VALIDATION FAILED:")
        for e in errors:
            print(" ✗", e)
        return False
    else:
        print(f"Data validation passed: {split} set looks healthy")
        return True

if __name__ == "__main__":
    ok = validate_dataset("data/fire.yaml")
    sys.exit(0 if ok else 1)
"""
        },
        {
            "step": 4,
            "title": "Register model versions in MLflow",
            "description": "Log training metrics and register the model artifact in the MLflow Model Registry.",
            "code": """\
# register_model.py
import mlflow, mlflow.pytorch
import torch, json
from pathlib import Path

TRACKING_URI = "http://mlflow-server:5000"     # or local: mlruns/
MODEL_NAME   = "drone-fire-detector"
WEIGHTS_PATH = "runs/ci/latest/weights/best.pt"
EVAL_JSON    = "runs/ci/latest/eval_results.json"

mlflow.set_tracking_uri(TRACKING_URI)
mlflow.set_experiment("fire-detection-ci")

with mlflow.start_run(run_name=f"ci-{Path(WEIGHTS_PATH).parent.parent.name}") as run:
    # Log hyperparameters
    mlflow.log_params({
        "model_arch": "yolov8s",
        "epochs": 50,
        "batch_size": 16,
        "imgsz": 640,
    })

    # Log evaluation metrics from evaluate.py output
    with open(EVAL_JSON) as f:
        metrics = json.load(f)
    mlflow.log_metrics(metrics)   # e.g., {"mAP50": 0.843, "mAP50-95": 0.612}

    # Log model artifact and register it
    mlflow.pytorch.log_model(
        pytorch_model=torch.load(WEIGHTS_PATH),
        artifact_path="model",
        registered_model_name=MODEL_NAME,
    )

    # Transition to Staging if metrics pass
    client = mlflow.tracking.MlflowClient(TRACKING_URI)
    latest_version = client.get_latest_versions(MODEL_NAME, stages=["None"])[0]
    if metrics.get("mAP50", 0) >= 0.78:
        client.transition_model_version_stage(
            name=MODEL_NAME,
            version=latest_version.version,
            stage="Staging",
        )
        print(f"Model v{latest_version.version} promoted to Staging (mAP50={metrics['mAP50']:.3f})")
    else:
        print(f"Model NOT promoted — mAP50={metrics.get('mAP50', 0):.3f} < 0.78 threshold")
"""
        },
        {
            "step": 5,
            "title": "Deploy with Triton canary release",
            "description": "Use Triton's model versioning to do a canary release: serve both old and new model versions and gradually shift traffic.",
            "code": """\
# triton_model_repo/fire-detector/
# model_config.pbtxt   ← Triton config
# 1/                   ← old model version (currently serving 100% traffic)
#   model.plan
# 2/                   ← new model (start with 0% traffic)
#   model.plan

# model_config.pbtxt
cat > model_repository/fire-detector/config.pbtxt << 'EOF'
name: "fire-detector"
backend: "tensorrt"
max_batch_size: 16
input [{ name: "images" data_type: TYPE_FP32 dims: [3, 640, 640] }]
output [{ name: "output0" data_type: TYPE_FP32 dims: [-1, 6] }]

dynamic_batching {
  preferred_batch_size: [4, 8]
  max_queue_delay_microseconds: 2000
}

version_policy { latest { num_versions: 2 } }  # serve last 2 versions
EOF

# Copy new TRT engine as version 2
mkdir -p model_repository/fire-detector/2
cp fire_detector_int8_v2.plan model_repository/fire-detector/2/model.plan

# Signal Triton to load the new version (no restart needed)
curl -X POST http://triton:8000/v2/repository/models/fire-detector/load

# Verify both versions are live
curl -s http://triton:8000/v2/models/fire-detector | python3 -m json.tool

# Gradually shift traffic via your load balancer or Istio VirtualService
# Start: 10% to version 2, 90% to version 1
# Monitor error rate + p99 latency for 30 minutes
# If healthy: 50/50 → 100% to version 2 → delete version 1
"""
        }
    ],
    "quiz": [
        {
            "question": "What is the key difference between Continuous Delivery and Continuous Deployment in ML?",
            "options": [
                "Continuous Delivery requires human approval before production; Continuous Deployment is fully automated",
                "Continuous Delivery uses GPU machines; Continuous Deployment uses CPU",
                "Continuous Delivery applies only to data; Continuous Deployment applies to models",
                "There is no difference — the terms are interchangeable"
            ],
            "answer": "Continuous Delivery requires human approval before production; Continuous Deployment is fully automated"
        },
        {
            "question": "Why does ML CI/CD include a model evaluation threshold (e.g., mAP >= 0.78)?",
            "options": [
                "To limit GPU usage during training",
                "To prevent a model that passes unit tests but has worse accuracy from being deployed",
                "To ensure the ONNX export is valid",
                "To enforce a maximum model file size"
            ],
            "answer": "To prevent a model that passes unit tests but has worse accuracy from being deployed"
        },
        {
            "question": "What does Great Expectations provide in the ML CI pipeline?",
            "options": [
                "Automated model training with hyperparameter search",
                "Data quality validation — schema checks, distribution checks, and label counts",
                "GPU cluster autoscaling",
                "TensorRT INT8 calibration"
            ],
            "answer": "Data quality validation — schema checks, distribution checks, and label counts"
        },
        {
            "question": "In a canary release with Triton, why are two model versions served simultaneously?",
            "options": [
                "To train two models with different hyperparameters and compare",
                "To allow gradual traffic shifting so rollback is instant if the new version regresses",
                "Because Triton cannot serve a single model version",
                "To double throughput by using both GPU nodes"
            ],
            "answer": "To allow gradual traffic shifting so rollback is instant if the new version regresses"
        },
        {
            "question": "What does `mlflow.pytorch.log_model` with `registered_model_name` do?",
            "options": [
                "Saves the model weights to the local filesystem",
                "Logs the model and registers it in the MLflow Model Registry under a named model lineage",
                "Converts the PyTorch model to ONNX format",
                "Deploys the model to a Triton server automatically"
            ],
            "answer": "Logs the model and registers it in the MLflow Model Registry under a named model lineage"
        },
        {
            "question": "Which GitHub Actions directive routes a job to a self-hosted GPU machine?",
            "options": [
                "runs-on: ubuntu-latest",
                "runs-on: self-hosted",
                "container: gpu-enabled",
                "device: nvidia"
            ],
            "answer": "runs-on: self-hosted"
        },
        {
            "question": "What does DVC `dvc pull` do at the start of the CI job?",
            "options": [
                "Pushes new model artifacts to cloud storage",
                "Downloads the versioned dataset files from the configured remote storage",
                "Runs the training pipeline in a fresh environment",
                "Generates synthetic training data"
            ],
            "answer": "Downloads the versioned dataset files from the configured remote storage"
        },
        {
            "question": "In the data validation script, what error condition would fail the CI step?",
            "options": [
                "Having more training images than validation images",
                "A class with fewer than 50 labelled samples in any split",
                "The dataset containing both .jpg and .png files",
                "Using YAML instead of JSON for the data config"
            ],
            "answer": "A class with fewer than 50 labelled samples in any split"
        },
        {
            "question": "What MLflow model stage is assigned after a successful evaluation in the example script?",
            "options": ["Production", "Staging", "Archived", "Approved"],
            "answer": "Staging"
        },
        {
            "question": "Which Triton config field allows the server to load and serve both version 1 and version 2 simultaneously?",
            "options": [
                "`max_batch_size: 2`",
                "`version_policy { latest { num_versions: 2 } }`",
                "`dynamic_batching { preferred_batch_size: [1, 2] }`",
                "`backend: multi-version`"
            ],
            "answer": "`version_policy { latest { num_versions: 2 } }`"
        }
    ]
}

# ──────────────────────────────────────────────────────────────────────
# Append new lessons to their respective tracks
# ──────────────────────────────────────────────────────────────────────

edge_track = find_track("edge ai")
if edge_track:
    # Check not already added
    if not any("TensorRT" in l["title"] for l in edge_track["lessons"]):
        edge_track["lessons"].append(tensorrt_lesson)
        print("Added new lesson: TensorRT Optimization & Deployment Pipeline")
    else:
        print("Lesson already present, skipping")

mlops_track = find_track("ml platform")
if mlops_track:
    if not any("CI/CD" in l["title"] for l in mlops_track["lessons"]):
        mlops_track["lessons"].append(mlops_cicd_lesson)
        print("Added new lesson: CI/CD for Machine Learning Models")
    else:
        print("Lesson already present, skipping")

# ──────────────────────────────────────────────────────────────────────
# Save
# ──────────────────────────────────────────────────────────────────────

with open(SRC, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("\n✓ drone_training.json updated successfully")

# Summary stats
for t in data["tracks"]:
    total_steps = sum(len(l["step_by_step_guide"]) for l in t["lessons"])
    total_quiz  = sum(len(l["quiz"]) for l in t["lessons"])
    print(f"  {t['name'][:35]:35s} | {len(t['lessons'])} lessons | {total_steps} steps | {total_quiz} quiz Qs")
