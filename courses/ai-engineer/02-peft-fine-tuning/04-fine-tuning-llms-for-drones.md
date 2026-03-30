# Lesson 4: Fine-Tuning LLMs for Drone Applications

## Learning Objectives
- Design training datasets for drone-specific language tasks
- Fine-tune vision-language models for aerial image understanding
- Build an end-to-end drone assistant using PEFT

## Drone-Specific Language Tasks

### Task 1: Aerial Image Captioning
Train a VLM to describe drone imagery in technical terms:
- Input: Aerial photo of a construction site
- Output: "Active construction site with 3 excavators operating in the NW quadrant. Steel framework 60% complete on main structure. 12 worker vehicles parked along eastern access road. No visible safety violations."

### Task 2: Mission Plan Generation
Train an LLM to generate flight plans:
- Input: Mission objective + environment conditions
- Output: Detailed waypoints, altitude, speed, sensor settings

### Task 3: Anomaly Description
Train a model to describe detected anomalies:
- Input: Thermal image with heat anomaly highlighted
- Output: "Thermal anomaly detected at grid reference 34.2N, 118.5W. Temperature delta of +15°C relative to surroundings. Pattern consistent with underground pipe leak. Confidence: 87%."

## Fine-Tuning a Vision-Language Model

```python
from transformers import LlavaForConditionalGeneration, AutoProcessor
from peft import LoraConfig, get_peft_model

# Load LLaVA (Vision-Language Model) with LoRA
model = LlavaForConditionalGeneration.from_pretrained(
    "llava-hf/llava-v1.6-mistral-7b-hf",
    torch_dtype=torch.float16,
    device_map="auto",
)
processor = AutoProcessor.from_pretrained("llava-hf/llava-v1.6-mistral-7b-hf")

# Apply LoRA to language model layers only (vision encoder stays frozen)
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    lora_dropout=0.05,
    bias="none",
)
model = get_peft_model(model, lora_config)

# Training data format for aerial image captioning
training_examples = [
    {
        "image": "drone_images/field_001.jpg",
        "conversations": [
            {"role": "user", "content": "<image>\nDescribe this aerial image in detail for a drone survey report."},
            {"role": "assistant", "content": "Agricultural field approximately 200 acres showing advanced wheat crop at heading stage. Irrigation pivot visible in center with uniform coverage pattern. Three zones of crop stress visible in SE quadrant — likely nitrogen deficiency based on yellowing pattern. Access roads on N and W boundaries in good condition. No standing water or erosion visible."}
        ]
    },
]
```

## Building a Drone Mission Assistant

### System Architecture

```
User Query: "Plan a search pattern for a missing person in a 2km² forest area"
    ↓
[Query Classifier] → Mission type: Search & Rescue
    ↓
[Load S&R LoRA adapter]
    ↓
[Context Injection] → Add: terrain data, weather, aircraft specs, regulations
    ↓
[LLM Generation] → Structured mission plan
    ↓
[Validation Layer] → Check: airspace, battery limits, safety margins
    ↓
Output: Validated flight plan with waypoints
```

### Implementation

```python
class DroneMissionAssistant:
    """Multi-adapter LLM assistant for drone mission planning."""
    
    def __init__(self, base_model_path, adapter_dir):
        self.base_model = AutoModelForCausalLM.from_pretrained(
            base_model_path,
            quantization_config=bnb_config,
            device_map="auto",
        )
        self.tokenizer = AutoTokenizer.from_pretrained(base_model_path)
        
        # Load mission-specific adapters
        self.adapters = {
            "survey": f"{adapter_dir}/survey_adapter",
            "inspection": f"{adapter_dir}/inspection_adapter",
            "search_rescue": f"{adapter_dir}/sar_adapter",
            "fire_detection": f"{adapter_dir}/fire_adapter",
        }
        self.current_adapter = None
    
    def set_mission_type(self, mission_type):
        """Swap LoRA adapter based on mission type."""
        if mission_type not in self.adapters:
            raise ValueError(f"Unknown mission: {mission_type}")
        
        if self.current_adapter:
            self.model = self.base_model  # Reset to base
        
        self.model = PeftModel.from_pretrained(
            self.base_model, 
            self.adapters[mission_type]
        )
        self.current_adapter = mission_type
    
    def generate_plan(self, mission_brief, weather, aircraft, constraints=None):
        """Generate a complete mission plan."""
        prompt = self._build_prompt(mission_brief, weather, aircraft, constraints)
        
        inputs = self.tokenizer(prompt, return_tensors="pt").to("cuda")
        outputs = self.model.generate(
            **inputs,
            max_new_tokens=1024,
            temperature=0.3,  # Low temp for factual planning
            do_sample=True,
            top_p=0.9,
        )
        
        plan = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return self._validate_plan(plan)
    
    def _build_prompt(self, brief, weather, aircraft, constraints):
        return f"""<|system|>
You are an expert drone mission planner. Generate safe, efficient flight plans 
following FAA Part 107 regulations. Always prioritize safety.
<|user|>
## Mission Brief
{brief}

## Weather Conditions
{weather}

## Aircraft
{aircraft}

## Constraints
{constraints or 'Standard operations'}

## Generate Flight Plan
Provide: waypoints, altitude, speed, sensor configuration, estimated duration, 
safety considerations, and abort criteria.
<|assistant|>
"""
    
    def _validate_plan(self, plan):
        """Basic validation of generated flight plan."""
        issues = []
        
        # Check for altitude limits
        if "above 400" in plan.lower() and "waiver" not in plan.lower():
            issues.append("WARNING: Altitude may exceed 400ft AGL limit")
        
        # Check for VLOS mention
        if "beyond visual line of sight" in plan.lower() and "bvlos waiver" not in plan.lower():
            issues.append("WARNING: BVLOS operation requires waiver")
        
        return {"plan": plan, "validation_issues": issues}

# Usage
assistant = DroneMissionAssistant(
    "meta-llama/Llama-3.1-8B",
    "./adapters"
)
assistant.set_mission_type("search_rescue")
result = assistant.generate_plan(
    mission_brief="Missing hiker, last seen at trail junction 42.3N 71.2W, 6 hours ago",
    weather="Clear, wind 5mph S, temperature 55°F, sunset in 2 hours",
    aircraft="DJI Matrice 30T with thermal + RGB",
    constraints="Mountainous terrain, tree canopy 80% coverage"
)
```

## Hands-On Lab

### Capstone Exercise: Build Your Drone Assistant
1. Collect/create 200+ drone mission examples across 4 mission types
2. Fine-tune separate QLoRA adapters for each mission type
3. Implement the `DroneMissionAssistant` class with adapter swapping
4. Create a simple CLI interface for mission planning
5. Evaluate: generate 20 plans per mission type, have them reviewed for accuracy

**Deliverables:**
- Trained adapters for 4 mission types
- Working assistant with adapter swapping
- Evaluation report comparing adapter quality vs base model

## Key Takeaways

1. Vision-language models can be adapted for aerial imagery with LoRA on the language component
2. Multi-adapter architecture enables a single base model to serve multiple mission types
3. Low temperature generation (0.3) produces more reliable mission plans
4. Always include a validation layer — LLMs can hallucinate unsafe parameters
5. QLoRA adapters are tiny (~50MB) making them practical for drone field operations

## Course Complete → Next Course: Multi-Modal Fusion
