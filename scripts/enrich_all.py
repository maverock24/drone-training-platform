import json

SRC = "courses/drone_training.json"

with open(SRC, "r") as f:
    data = json.load(f)

arch_mastery_exp = """Vision Transformers (ViT) and Multi-Modal Architectures are the bedrock of modern aerial perception. Unlike traditional Convolutional Neural Networks (CNNs) that rely on localized inductive biases, ViTs treat visual inputs as sequences of flattened 2D patches. These patches are linearly embedded and augmented with positional encodings before processing via stacked Transformer Encoders. This mechanism enables self-attention, allowing the model to capture dense, global contextual relationships out-of-the-box—critical for tasks like analyzing expansive topographic structures from drone-captured aerial imagery.

**Why Transformers for Drones?**
When flying at 400 feet, objects of interest (e.g., a lost hiker or a structural crack in a wind turbine) can occupy a very small portion of the image. Standard CNN max-pooling layers often lose this high-frequency, low-resolution data. Vision Transformers use multi-head self-attention to globally correlate information across the entire frame immediately at layer 1. This means the model can cross-reference the texture of a small cluster of pixels with the broader context of the forest canopy, dramatically reducing false positives.

**Multi-Modal Frameworks (CLIP & ALIGN)**
Beyond localized perception, multi-modal frameworks like CLIP (Contrastive Language-Image Pre-training) project text and images into a shared dense vector space. This learned latent representation allows drones to perform zero-shot inferences and semantic scene retrievals based purely on unconstrained natural language queries. For instance, an operator can command a drone to "locate thermal anomalies in the eastern sector" or "find downed power lines", and the multi-modal brain can dynamically match the live visual feed against the semantic query, bypassing the need for explicit class-based retraining. This drastically reduces the time-to-production for bespoke operational payloads.

**Deployment Architecture**
Deploying these large models on constrained edge hardware like the Jetson Orin requires architectural sympathy. You will need to export the PyTorch ViT into an ONNX graph, then compile it down to a TensorRT engine. This strips away Python overhead and fuses kernel operations, minimizing latency and maximizing throughput.

### 💻 Developer Guidance: Writing Production AI Code
As you progress through the coding steps below, keep these principles in mind:
- **Tensor Shapes & Types:** Always assert tensor dimensions (`assert x.shape == (B, C, H, W)`). Edge compilers are unforgiving with dynamic shapes.
- **Hardware Agnosticism:** Keep model initialization separate from host-to-device transfers. Use `.to(device)` robustly.
- **Memory Footprint:** Delete intermediary tensors and call `torch.cuda.empty_cache()` where appropriate during inference streams.
"""

arch_mastery_steps = [
    {
      "step": 1,
      "title": "Set up your Python environment and Edge AI Toolkit",
      "description": "Create an isolated virtual environment and install all necessary deep learning and edge deployment libraries. It is crucial to have the memory and math profiling tools (`torch.profiler`) ready from day one.\n\n**Code implementation details:** We use strict versioning to prevent upstream API breaks from disrupting the flight software. Make sure you load your CUDA modules correctly so the GPU can parse these instructions off the CPU main thread.",
      "code": "python -m venv vit-env\nsource vit-env/bin/activate  # On Windows: vit-env\\Scripts\\activate\n\n# Install core AI and vision libraries with strict versions for stability\npip install torch==2.3.0 torchvision transformers==4.40.0 datasets matplotlib numpy\n\n# Validate CUDA availability for Edge inference\npython -c \"import torch; assert torch.cuda.is_available(), 'CUDA must be present for drone pipelines!'\"\nprint('Environment successfully configured with GPU acceleration.')"
    },
    {
      "step": 2,
      "title": "Implement a Vision Transformer (ViT) from scratch",
      "description": "Write the core components: patch embedding, multi-head self-attention, and the Transformer encoder. We must carefully handle the reshaping of image arrays into 1D sequence tokens, mimicking the NLP approach.\n\n**Code implementation details:** Pay attention to `PatchEmbedding`. By utilizing `nn.Conv2d` with a kernel and stride equal to the patch size, we efficiently chunk the image and apply linear projection simultaneously. This saves immense computational overhead compared to manual unrolling.",
      "code": "import torch\nimport torch.nn as nn\nimport torch.nn.functional as F\n\nclass PatchEmbedding(nn.Module):\n    def __init__(self, img_size=224, patch_size=16, in_channels=3, embed_dim=768):\n        super().__init__()\n        self.num_patches = (img_size // patch_size) ** 2\n        # Efficient patch extraction + linear projection using Conv2D\n        self.proj = nn.Conv2d(in_channels, embed_dim, kernel_size=patch_size, stride=patch_size)\n\n    def forward(self, x):\n        # x shape: (B, C, H, W)\n        x = self.proj(x)  # -> (B, embed_dim, H_patches, W_patches)\n        x = x.flatten(2).transpose(1, 2)  # -> (Batch, num_patches, embed_dim)\n        return x\n\nclass MultiHeadSelfAttention(nn.Module):\n    def __init__(self, embed_dim, num_heads):\n        super().__init__()\n        self.num_heads = num_heads\n        self.head_dim = embed_dim // num_heads\n        self.scale = self.head_dim ** -0.5\n        \n        # Compute Q, K, V simultaneously for better cache coherency\n        self.qkv = nn.Linear(embed_dim, embed_dim * 3)\n        self.proj = nn.Linear(embed_dim, embed_dim)\n\n    def forward(self, x):\n        B, N, C = x.shape\n        qkv = self.qkv(x).reshape(B, N, 3, self.num_heads, self.head_dim).permute(2, 0, 3, 1, 4)\n        q, k, v = qkv[0], qkv[1], qkv[2]\n        \n        # Self-Attention computation\n        attn = (q @ k.transpose(-2, -1)) * self.scale\n        attn = attn.softmax(dim=-1)\n        \n        x = (attn @ v).transpose(1, 2).reshape(B, N, C)\n        return self.proj(x)\n\nclass TransformerBlock(nn.Module):\n    def __init__(self, embed_dim, num_heads, mlp_ratio=4.0):\n        super().__init__()\n        self.norm1 = nn.LayerNorm(embed_dim)\n        self.attn = MultiHeadSelfAttention(embed_dim, num_heads)\n        self.norm2 = nn.LayerNorm(embed_dim)\n        \n        mlp_hidden = int(embed_dim * mlp_ratio)\n        self.mlp = nn.Sequential(\n            nn.Linear(embed_dim, mlp_hidden),\n            nn.GELU(),\n            nn.Linear(mlp_hidden, embed_dim)\n        )\n\n    def forward(self, x):\n        # Residual connections prevent vanishing gradients in deep networks\n        x = x + self.attn(self.norm1(x))\n        x = x + self.mlp(self.norm2(x))\n        return x\n\nclass ViT(nn.Module):\n    def __init__(self, img_size=224, patch_size=16, in_channels=3, num_classes=1000,\n                 embed_dim=768, depth=12, num_heads=12):\n        super().__init__()\n        self.patch_embed = PatchEmbedding(img_size, patch_size, in_channels, embed_dim)\n        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))\n        \n        # Learnable Positional Embeddings to preserve spatial awareness\n        self.pos_embed = nn.Parameter(torch.zeros(1, 1 + self.patch_embed.num_patches, embed_dim))\n        self.blocks = nn.Sequential(*[TransformerBlock(embed_dim, num_heads) for _ in range(depth)])\n        self.norm = nn.LayerNorm(embed_dim)\n        self.head = nn.Linear(embed_dim, num_classes)\n\n    def forward(self, x):\n        B = x.shape[0]\n        x = self.patch_embed(x)\n        \n        # Append the classification token\n        cls_tokens = self.cls_token.expand(B, -1, -1)\n        x = torch.cat((cls_tokens, x), dim=1)\n        x = x + self.pos_embed\n        \n        x = self.blocks(x)\n        x = self.norm(x)\n        \n        # Only pass the class token to the final classification head\n        return self.head(x[:, 0])\n\n# --- Production Guidance ---\n# Standardize an input pipeline mock\nmodel = ViT(img_size=224, patch_size=16, num_classes=10)\ndummy_imagery_batch = torch.randn(1, 3, 224, 224)\nlogits = model(dummy_imagery_batch)\nprint(f'Successfully completed forward pass. Logits shape: {logits.shape}')"
    },
    {
      "step": 3,
      "title": "Load a pretrained CLIP model for zero-shot detection",
      "description": "Use Hugging Face transformers to load OpenAI's CLIP. CLIP bridges the gap between vision and language by mapping images and text into the exact same vector space.\n\n**Code implementation details:** We use `torch.no_grad()` to freeze the computational graph. In an Edge AI embedded pipeline, leaving gradients enabled will exhaust memory instantaneously. Furthermore, observe how we interpret the raw model `logits_per_image` through a softmax activation to derive human-readable confidence scores.",
      "code": "from transformers import CLIPProcessor, CLIPModel\nimport torch\nfrom PIL import Image\nimport requests\n\n# Initialize model and processor in evaluation mode\nmodel_id = \"openai/clip-vit-base-patch32\"\nprint(f'Loading Multi-Modal network: {model_id}...')\nmodel = CLIPModel.from_pretrained(model_id).eval()\nprocessor = CLIPProcessor.from_pretrained(model_id)\n\n# Fetch a real aerial frame representing a drone's viewpoint\nurl = \"https://images.unsplash.com/photo-1506905925257-2beddb45ecca\"\nraw_frame = Image.open(requests.get(url, stream=True).raw)\n\n# Define the unconstrained natural language queries for the drone payload\nsemantic_queries = [\n    \"an aerial view of a dense forest payload\",\n    \"an urban cityscape with skyscrapers\",\n    \"an ocean shoreline with crashing waves\"\n]\n\n# Preprocess image and text jointly\ninputs = processor(text=semantic_queries, images=raw_frame, return_tensors=\"pt\", padding=True)\n\n# Inference executed strictly without gradients to conserve onboard RAM\nwith torch.no_grad():\n    outputs = model(**inputs)\n    logits_per_image = outputs.logits_per_image  \n    \n    # Convert abstract vector logits to probability metrics\n    probabilities = logits_per_image.softmax(dim=1).flatten().tolist()\n\nprint(\"\\n--- Zero-Shot Inference Results ---\")\nfor query, prob in zip(semantic_queries, probabilities):\n    print(f\"Confidence [{query}]: {prob * 100:.2f}%\")\n\n# --- Production Guidance ---\n# 1. On edge hardware, cache your text embeddings ahead of time if the target list is static.\n# 2. Re-computing `processor(text=...)` per frame wastes massive amounts of compute overhead."
    },
    {
      "step": 4,
      "title": "Train a Custom Contrastive Model on Drone Telemetry",
      "description": "Construct an end-to-end InfoNCE contrastive loss pipeline using custom drone imagery and metadata (altitude, pitch, yaw) enriched text descriptions. This allows us to fine-tune open-source multi-modal models directly on proprietary datasets.\n\n**Code implementation details:** The formulation calculates dot-products as similarity metrics and drives pairs residing on the diagonal matrix to 1.0 while suppressing off-diagonal alignments to 0.0. Temperature scaling is tightly wrapped in the logic to soften harsh vector extremes.",
      "code": "import torch\nimport torch.nn.functional as F\n\ndef contrastive_loss(image_embeddings, text_embeddings, temperature=0.07):\n    \"\"\"\n    Computes the InfoNCE Contrastive Loss used to train CLIP.\n    The goal is to align embeddings in the same latent space so matching\n    (image, text) pairs have high dot-product similarity.\n    \"\"\"\n    # L2 Normalization projects vectors onto a unit hypersphere\n    image_embeddings = F.normalize(image_embeddings, p=2, dim=1)\n    text_embeddings = F.normalize(text_embeddings, p=2, dim=1)\n    \n    # Calculate cosine similarity matrices (B, B)\n    logits = (image_embeddings @ text_embeddings.T) / temperature\n    \n    # The ground truth is a diagonal matrix (i-th image matches i-th text)\n    labels = torch.arange(logits.shape[0]).to(logits.device)\n    \n    # Symmetric cross entropy loss penalizes misalignments in both planes\n    loss_i = F.cross_entropy(logits, labels)\n    loss_t = F.cross_entropy(logits.T, labels)\n    return (loss_i + loss_t) / 2\n\n# Simulate batch embeddings outputs from our drone sensors (batch_size=32, dims=512)\nimg_emb = torch.randn(32, 512)\ntxt_emb = torch.randn(32, 512)\n\n# Simulate an optimization step\noptimizer = torch.optim.AdamW([img_emb, txt_emb], lr=1e-4)\noptimizer.zero_grad()\n\nloss = contrastive_loss(img_emb, txt_emb)\nloss.backward() # Computes gradients\n# optimizer.step() # Updates weights (commented out for simulation)\n\nprint(f'Calculated Training Iteration InfoNCE Constraint Loss: {loss.item():.4f}')\nprint('Vector gradients successfully propagated backward through the network.')\n\n# --- Production Guidance ---\n# 1. Be aware of `temperature` values. Too high will cause uniform distributions; too low yields harsh confident gradients.\n# 2. When scaling this to large batch sizes, use Distributed Data Parallel (DDP) to split batches across multiple GPUs."
    }
]

generic_coding_guide = """

---
### 💻 Drone & AI Coding Best Practices
When writing code for modern drone systems, it is critical to focus on **reliability, error handling, and performance profiling**—three pillars of autonomous software engineering. 

**1. Input Validation:** Always validate sensor data shapes, image dimensions, and telemetry bounds before passing them into neural networks or safety-critical control loops. A sudden null frame from a disconnected camera must be caught gracefully.
**2. Asynchronous Execution:** Avoid blocking the main event loop. Use `asyncio` natively or leverage C++ multithreading via ROS 2 executors.
**3. Edge Memory Management:** On devices like the Nvidia Jetson, unified memory is limited. Avoid excessive `cudaMemcpy` transfers between host and device unless explicitly necessary using `pinned` memory.
**4. Observability:** Every critical drone software state change should issue a structured (JSON) timestamped log to aid post-flight anomaly reconstruction. 

**Guidance for the Code Below:** Review the step-by-step code blocks. Look at the defensive programming tactics, the assertion statements, and optimization patterns tailored specifically for flight hardware.
"""

for track in data["tracks"]:
    for lesson in track["lessons"]:
        # 1. Target the specific Architectural Mastery lesson
        if "Architectural Mastery" in lesson["title"]:
            lesson["detailed_explanation"] = arch_mastery_exp
            lesson["step_by_step_guide"] = arch_mastery_steps
        else:
            # 2. Enhance generic lessons
            if "### 💻 Drone & AI Coding Best Practices" not in lesson["detailed_explanation"]:
                lesson["detailed_explanation"] += generic_coding_guide
                
            for step in lesson["step_by_step_guide"]:
                if "Code structure note:" not in step["description"]:
                    step["description"] += "\n\n**Code structure note:** Pay careful attention to the error handling and input validation in this step. Edge deployments require defensive programming—always verify tensor shapes, sanitize hardware inputs, and manage memory constraints directly."
                    
                if step.get("code") and "# --- Production Deployment Reminders ---" not in step["code"]:
                    enhancement = "\n\n# --- Production Deployment Reminders ---\n"
                    enhancement += "# 1. Rigorously benchmark this execution via Nsight Systems or PyTorch Profiler.\n"
                    enhancement += "# 2. Catch Out-of-Memory (OOM) anomalies gracefully and fallback to a safe state mode.\n"
                    enhancement += "# 3. Validate logical outputs and strict typing before dispatching signals to the flight controller."
                    step["code"] += enhancement

with open(SRC, "w") as f:
    json.dump(data, f, indent=2)

print("All lessons successfully enriched with comprehensive guidance and code.")
