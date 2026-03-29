export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Track {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  modules: Module[];
}

export const tracks: Track[] = [
  {
    id: "ai-engineer",
    title: "AI Engineer (Generalist)",
    shortTitle: "AI Engineer",
    description:
      'Architecting and optimizing "Brains" that can see, reason, and adapt.',
    icon: "Brain",
    color: "text-violet-500",
    gradient: "from-violet-600 to-purple-600",
    modules: [
      {
        id: "arch-mastery",
        title: "Architectural Mastery (CV & LLMs)",
        description:
          "Move beyond standard CNNs to cutting-edge vision and language architectures.",
        lessons: [
          {
            id: "vit",
            title: "Vision Transformers (ViT)",
            description:
              "Implement Patch Embedding and Multi-Head Self-Attention for image processing. Move beyond standard CNNs to transformer-based architectures.",
            duration: "4h",
            difficulty: "advanced",
          },
          {
            id: "peft",
            title: "PEFT: LoRA & QLoRA",
            description:
              "Master Parameter-Efficient Fine-Tuning to adapt LLMs (Llama 4, Mistral) on consumer GPUs using LoRA and QLoRA techniques.",
            duration: "3h",
            difficulty: "intermediate",
          },
          {
            id: "multimodal",
            title: "Multi-modal Fusion",
            description:
              "Build CLIP-style encoders that align image features with text embeddings for natural language drone queries.",
            duration: "5h",
            difficulty: "advanced",
          },
        ],
      },
      {
        id: "prod-opt",
        title: "The Production Optimization Stack",
        description:
          "Optimize models for real-world deployment with quantization, distillation, and pruning.",
        lessons: [
          {
            id: "quantization",
            title: "Quantization (FP8 & INT4)",
            description:
              "Implement FP8 (standard in 2026) and INT4 precision using NVIDIA Model Optimizer for maximum inference speed.",
            duration: "3h",
            difficulty: "advanced",
          },
          {
            id: "distillation",
            title: "Knowledge Distillation",
            description:
              'Train a "Student" model (MobileNetV4) to mimic a "Teacher" (massive ViT) using Kullback-Leibler (KL) Divergence loss.',
            duration: "4h",
            difficulty: "advanced",
          },
          {
            id: "pruning",
            title: "Sparsity & Pruning",
            description:
              "Apply Unstructured Pruning to remove weights with near-zero importance, reducing model size by 40% with <1% accuracy loss.",
            duration: "3h",
            difficulty: "intermediate",
          },
        ],
      },
    ],
  },
  {
    id: "mlops-engineer",
    title: "ML Platform Engineer (MLOps)",
    shortTitle: "MLOps Engineer",
    description:
      'Building the automated "Factory" where models are born and maintained.',
    icon: "Factory",
    color: "text-cyan-500",
    gradient: "from-cyan-600 to-blue-600",
    modules: [
      {
        id: "iac",
        title: "Infrastructure as Code (IaC)",
        description:
          "Script and automate the creation of GPU-powered infrastructure.",
        lessons: [
          {
            id: "k8s-ai",
            title: "Kubernetes for AI",
            description:
              "Master NVIDIA GPU Operator to expose GPUs to K8s pods. Use Karpenter for dynamic GPU node scaling on AWS.",
            duration: "5h",
            difficulty: "advanced",
          },
          {
            id: "terraform",
            title: "Terraform / Pulumi",
            description:
              "Script the creation of VPCs, S3 buckets, and high-performance GPU clusters as reproducible infrastructure.",
            duration: "4h",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "orchestration",
        title: "Workflow Orchestration",
        description: "Build modular, reusable ML pipelines.",
        lessons: [
          {
            id: "kubeflow",
            title: "Kubeflow Pipelines",
            description:
              "Build modular components (Data Prep → Train → Eval) that are reusable across projects.",
            duration: "4h",
            difficulty: "intermediate",
          },
          {
            id: "dvc",
            title: "DVC (Data Version Control)",
            description:
              'Version 500GB+ datasets as strictly as code. Ensure every model "artifact" is linked to the exact data version used.',
            duration: "3h",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "serving",
        title: "Serving & Reliability",
        description:
          "Deploy and monitor models in production with confidence.",
        lessons: [
          {
            id: "triton",
            title: "NVIDIA Triton Inference Server",
            description:
              "Deploy multi-framework models (PyTorch, ONNX, TensorRT) on a single server with Dynamic Batching.",
            duration: "4h",
            difficulty: "advanced",
          },
          {
            id: "observability",
            title: "Observability & Drift Detection",
            description:
              'Set up Prometheus/Grafana for hardware metrics and Evidently AI for monitoring "Model Drift."',
            duration: "3h",
            difficulty: "intermediate",
          },
        ],
      },
    ],
  },
  {
    id: "data-engineer",
    title: "Data Engineer (Geospatial & Sensor Fusion)",
    shortTitle: "Data Engineer",
    description:
      'The "Supply Chain" for multi-modal drone intelligence.',
    icon: "Database",
    color: "text-emerald-500",
    gradient: "from-emerald-600 to-teal-600",
    modules: [
      {
        id: "geoai",
        title: "Geospatial Intelligence (GeoAI)",
        description:
          "Master spatial data formats, indexing, and streaming for drone imagery.",
        lessons: [
          {
            id: "postgis",
            title: "PostGIS & Spatial Indexing",
            description:
              'Write SQL queries to find "all images taken within 50 meters of a power line." Master spatial indexes for fast geospatial queries.',
            duration: "4h",
            difficulty: "intermediate",
          },
          {
            id: "stac",
            title: "STAC API Implementation",
            description:
              "Implement a SpatioTemporal Asset Catalog API to make millions of drone images searchable by time and coordinates.",
            duration: "3h",
            difficulty: "intermediate",
          },
          {
            id: "cogs",
            title: "Cloud Optimized GeoTIFFs (COGs)",
            description:
              'Master this format to allow models to "stream" only the pixels they need from a 10GB aerial map without downloading the whole file.',
            duration: "3h",
            difficulty: "advanced",
          },
        ],
      },
      {
        id: "sensor-fusion",
        title: "Sensor Fusion Pipelines",
        description:
          "Combine LiDAR, cameras, and telemetry into coherent datasets.",
        lessons: [
          {
            id: "lidar",
            title: "LiDAR Processing",
            description:
              'Use Open3D or PCL to filter "noise" from point clouds and perform Point-to-Plane Registration.',
            duration: "4h",
            difficulty: "advanced",
          },
          {
            id: "telemetry",
            title: "Telemetry Syncing",
            description:
              "Align MAVLink/PX4 logs (100Hz) with camera shutter triggers (2Hz) using interpolation for perfect sensor alignment.",
            duration: "3h",
            difficulty: "intermediate",
          },
        ],
      },
      {
        id: "labeling",
        title: "Labeling & QA",
        description:
          "Automate the data labeling pipeline with active learning.",
        lessons: [
          {
            id: "active-learning",
            title: "Active Learning Pipelines",
            description:
              'Write scripts that automatically identify "low confidence" model predictions and send them to human labelers in CVAT or Labelbox.',
            duration: "3h",
            difficulty: "intermediate",
          },
        ],
      },
    ],
  },
  {
    id: "edge-ai-engineer",
    title: "Edge AI Engineer",
    shortTitle: "Edge AI",
    description:
      'The "Physical Integration" of AI into the drone\'s nervous system.',
    icon: "Cpu",
    color: "text-orange-500",
    gradient: "from-orange-600 to-red-600",
    modules: [
      {
        id: "on-device",
        title: "On-Device Hardware (Jetson/Thor)",
        description:
          "Write custom CUDA kernels and build hardware-accelerated pipelines.",
        lessons: [
          {
            id: "cuda",
            title: "CUDA & C++ Kernels",
            description:
              "Write custom CUDA Kernels for specialized image pre-processing (like real-time undistortion) to offload the CPU.",
            duration: "5h",
            difficulty: "advanced",
          },
          {
            id: "deepstream",
            title: "NVIDIA DeepStream SDK",
            description:
              "Master the DeepStream SDK for building multi-camera video analytics pipelines that run entirely on hardware.",
            duration: "4h",
            difficulty: "advanced",
          },
        ],
      },
      {
        id: "robotics",
        title: "Robotics Middleware",
        description:
          "Bridge AI vision with flight controllers using ROS 2.",
        lessons: [
          {
            id: "ros2",
            title: "ROS 2 (Humble/Jazzy)",
            description:
              "Master Nodes, Topics, and Actions. Use Micro-ROS for communicating with low-power microcontrollers (STM32/ESP32).",
            duration: "5h",
            difficulty: "advanced",
          },
          {
            id: "mavros",
            title: "MAVROS Integration",
            description:
              'Build the bridge between your AI "Vision" node and the Pixhawk/ArduPilot flight controller.',
            duration: "4h",
            difficulty: "advanced",
          },
        ],
      },
      {
        id: "optimization",
        title: "Optimization for Survival",
        description:
          "Test and profile your AI before it touches the sky.",
        lessons: [
          {
            id: "hil",
            title: "Hardware-in-the-Loop (HIL)",
            description:
              'Use NVIDIA Isaac Sim to simulate a drone\'s flight, sending "virtual" camera data to a real Jetson board to test the AI.',
            duration: "4h",
            difficulty: "advanced",
          },
          {
            id: "latency",
            title: "Latency Profiling with Nsight",
            description:
              'Use Nsight Systems to find "bottlenecks" — image resize, model inference, or flight command latency?',
            duration: "3h",
            difficulty: "intermediate",
          },
        ],
      },
    ],
  },
];

export const grandProject = {
  title: 'The 2026 "Grand Project"',
  subtitle: "Autonomous Forest Fire Detection System",
  description:
    "Tie all four tracks together by building a complete autonomous system that detects forest fires using drones, thermal cameras, and AI.",
  phases: [
    {
      track: "Data Engineer",
      color: "from-emerald-600 to-teal-600",
      icon: "Database",
      title: "3D Forest Mapping",
      description:
        "Process thermal and LiDAR data to create a 3D map of a forest. Implement sensor fusion pipelines and geospatial indexing.",
      tasks: [
        "Ingest thermal camera and LiDAR point cloud data",
        "Fuse multi-sensor data with telemetry timestamps",
        "Build a 3D spatial index using PostGIS",
        "Serve data through a STAC-compliant API",
      ],
    },
    {
      track: "AI Engineer",
      color: "from-violet-600 to-purple-600",
      icon: "Brain",
      title: "Smoke Plume Detection ViT",
      description:
        "Train a Vision Transformer optimized for small smoke plume detection. Apply knowledge distillation and quantization for edge deployment.",
      tasks: [
        "Fine-tune a ViT on thermal smoke datasets using QLoRA",
        "Apply Knowledge Distillation to a MobileNetV4 student model",
        "Quantize to FP8 for Jetson deployment",
        "Achieve <50ms inference on target hardware",
      ],
    },
    {
      track: "Edge AI Engineer",
      color: "from-orange-600 to-red-600",
      icon: "Cpu",
      title: "Real-time Obstacle Avoidance",
      description:
        "Deploy the detection model to a drone that avoids trees in real-time using ROS 2 and MAVROS integration.",
      tasks: [
        "Deploy optimized model via DeepStream on Jetson",
        "Implement ROS 2 vision node with MAVROS bridge",
        "Add real-time obstacle avoidance with LiDAR",
        "Validate with HIL simulation in Isaac Sim",
      ],
    },
    {
      track: "MLOps Engineer",
      color: "from-cyan-600 to-blue-600",
      icon: "Factory",
      title: "Continuous Learning Loop",
      description:
        'Automatically upload "near miss" obstacles to the cloud and improve the detection model for the next flight.',
      tasks: [
        "Set up Kubeflow pipeline for retraining",
        "Stream edge telemetry to cloud via DVC",
        "Monitor model drift with Evidently AI",
        "Auto-deploy improved models via Triton",
      ],
    },
  ],
};

export function getTotalLessons(): number {
  return tracks.reduce(
    (acc, track) =>
      acc +
      track.modules.reduce((mAcc, mod) => mAcc + mod.lessons.length, 0),
    0
  );
}

export function getTotalDuration(): string {
  const totalHours = tracks.reduce(
    (acc, track) =>
      acc +
      track.modules.reduce(
        (mAcc, mod) =>
          mAcc +
          mod.lessons.reduce(
            (lAcc, lesson) => lAcc + parseInt(lesson.duration),
            0
          ),
        0
      ),
    0
  );
  return `${totalHours}h`;
}
