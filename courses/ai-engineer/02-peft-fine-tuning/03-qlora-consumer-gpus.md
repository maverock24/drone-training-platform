# Lesson 3: QLoRA — Fine-Tuning on Consumer GPUs

## Learning Objectives
- Understand 4-bit NormalFloat (NF4) quantization
- Implement QLoRA to fine-tune large models on a single GPU
- Apply QLoRA to adapt LLMs for drone mission planning

## What Makes QLoRA Special

QLoRA combines three innovations:
1. **4-bit NormalFloat Quantization** — compress the base model to 4-bit precision
2. **Double Quantization** — quantize the quantization constants themselves
3. **Paged Optimizers** — use CPU RAM as overflow when GPU memory is full

This allows fine-tuning a 30B parameter model on a single 24GB GPU.

### Memory Comparison

| Method | Llama 3 8B | Llama 4 Scout 17B | Mistral 7B |
|--------|-----------|-------------------|------------|
| Full FT (FP16) | 80 GB | 160 GB | 70 GB |
| LoRA (FP16) | 18 GB | 36 GB | 16 GB |
| QLoRA (NF4) | **6 GB** | **12 GB** | **5 GB** |

## NormalFloat4 (NF4) Quantization

NF4 is information-theoretically optimal for normally distributed weights. Since neural network weights follow a normal distribution, NF4 minimizes quantization error.

```python
import torch
from transformers import BitsAndBytesConfig

# QLoRA quantization config
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",          # NormalFloat4 (optimal for normal dist)
    bnb_4bit_compute_dtype=torch.bfloat16,  # Compute in BF16 for stability
    bnb_4bit_use_double_quant=True,      # Quantize the quantization constants
)
```

### How NF4 Works

Standard INT4 uses 16 equally-spaced values: {-8, -7, ..., 6, 7}

NF4 uses 16 values optimally placed for normal distributions:
```
NF4 values: {-1.0, -0.6962, -0.5251, -0.3949, -0.2844, -0.1848, -0.0911, 0.0,
              0.0796, 0.1609, 0.2461, 0.3379, 0.4407, 0.5626, 0.7230, 1.0}
```

More values are clustered near zero where most weights live, fewer at the tails.

## Complete QLoRA Training Pipeline

```python
from transformers import (
    AutoModelForCausalLM, 
    AutoTokenizer,
    TrainingArguments,
    BitsAndBytesConfig,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer
from datasets import load_dataset

# Step 1: Load model in 4-bit
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

model_name = "meta-llama/Llama-3.1-8B"
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)
tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.pad_token = tokenizer.eos_token

# Step 2: Prepare model for k-bit training
model = prepare_model_for_kbit_training(model)
model.gradient_checkpointing_enable()

# Step 3: Configure LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# Step 4: Prepare drone-specific training data
drone_dataset = load_dataset("json", data_files="drone_missions.jsonl")

def format_drone_prompt(example):
    return f"""### Mission Brief
{example['mission_description']}

### Drone Configuration
Aircraft: {example['aircraft_type']}
Sensors: {example['sensors']}
Environment: {example['environment']}

### Flight Plan
{example['flight_plan']}

### Safety Assessment
{example['safety_notes']}"""

# Step 5: Train
training_args = TrainingArguments(
    output_dir="./drone-llm-qlora",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    weight_decay=0.01,
    warmup_ratio=0.03,
    lr_scheduler_type="cosine",
    logging_steps=10,
    save_strategy="epoch",
    bf16=True,
    optim="paged_adamw_8bit",  # Paged optimizer for memory efficiency
    max_grad_norm=0.3,
    group_by_length=True,
)

trainer = SFTTrainer(
    model=model,
    train_dataset=drone_dataset["train"],
    formatting_func=format_drone_prompt,
    args=training_args,
    max_seq_length=2048,
)

trainer.train()

# Step 6: Save LoRA adapter (only ~50MB vs 16GB for full model)
model.save_pretrained("./drone-mission-adapter")
```

## Creating a Drone Mission Dataset

```python
import json

# Example training data for drone mission planning
drone_missions = [
    {
        "mission_description": "Survey a 500-acre agricultural field for crop health assessment using NDVI analysis.",
        "aircraft_type": "DJI Matrice 350 RTK",
        "sensors": "MicaSense RedEdge-P multispectral camera",
        "environment": "Clear skies, wind 8mph NW, temperature 72°F, daylight",
        "flight_plan": "Grid pattern at 120m AGL, 80% front overlap, 70% side overlap, speed 8m/s. Total flight time: 45 minutes across 3 battery swaps.",
        "safety_notes": "Maintain VLOS. Avoid power lines on north boundary. NOTAMs checked — no TFRs active. Nearest airport 12nm SE."
    },
    {
        "mission_description": "Inspect a damaged building after an earthquake for structural integrity assessment.",
        "aircraft_type": "Skydio X10",
        "sensors": "Visual + thermal cameras, LiDAR",
        "environment": "Overcast, wind 12mph variable, dust present, post-disaster",
        "flight_plan": "Orbit building at 30m, 50m, and 70m distances. Capture thermal and visual at each orbit. LiDAR scan at closest orbit. Duration: 25 minutes.",
        "safety_notes": "Structure may be unstable — maintain minimum 20m standoff. Watch for falling debris. Emergency landing zone identified 100m south."
    },
]

with open("drone_missions.jsonl", "w") as f:
    for mission in drone_missions:
        f.write(json.dumps(mission) + "\n")
```

## Inference with QLoRA Adapter

```python
from peft import PeftModel

# Load base model (quantized) + adapter
base_model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.1-8B",
    quantization_config=bnb_config,
    device_map="auto",
)
model = PeftModel.from_pretrained(base_model, "./drone-mission-adapter")

# Generate mission plan
prompt = """### Mission Brief
Search for a missing hiker in a mountainous region with dense tree coverage.
Area of interest: 2 square miles. Last known position: 38.5°N, 105.2°W.

### Drone Configuration
Aircraft: DJI Matrice 30T
Sensors: Thermal + RGB camera
Environment: Dusk, temperature dropping to 45°F, light wind

### Flight Plan
"""

inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
outputs = model.generate(**inputs, max_new_tokens=500, temperature=0.7)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

## Hands-On Lab

### Exercise 1: QLoRA on Your GPU
1. Install BitsAndBytes: `pip install bitsandbytes`
2. Load Mistral-7B in 4-bit quantization
3. Apply QLoRA with rank 16
4. Monitor GPU memory usage with `nvidia-smi`
5. Fine-tune on 100 drone mission examples for 1 epoch

### Exercise 2: Quality vs Efficiency
Compare on the same drone mission benchmark:
1. Full fine-tuned model (if you have the GPU)
2. LoRA (FP16) fine-tuned model
3. QLoRA (NF4) fine-tuned model
4. Measure: BLEU score, latency, memory, and qualitative mission plan quality

### Exercise 3: Multi-Adapter Setup
1. Train Adapter A: Fire detection mission planning
2. Train Adapter B: Agricultural survey planning
3. Train Adapter C: Search and rescue planning
4. Write code to dynamically swap adapters based on mission type

## Key Takeaways

1. QLoRA = 4-bit NF4 quantization + LoRA + paged optimizers
2. Fine-tune 8B+ models on a single consumer GPU (24GB)
3. NF4 is optimal for normally distributed weights
4. Paged optimizers handle GPU memory overflow gracefully
5. Adapter files are tiny (~50MB) vs full model (16GB+)

## Next Lesson → Fine-Tuning LLMs for Drone Applications
