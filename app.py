import json
import json5
import math
import random

# Paths
input_path = r"C:\Users\jayas\OneDrive\Desktop\Recipefinder\recipe-finder\src\data\final_recipes.json"
output_path = r"C:\Users\jayas\OneDrive\Desktop\Recipefinder\recipe-finder\src\data\final_recipes_clean.json"

# Define possible moods
moods = ["happy", "sad", "lazy", "rainy", "energetic", "general"]

def clean_invalid_values(obj):
    """Recursively clean invalid JSON values and rename keys."""
    if isinstance(obj, dict):
        new_obj = {}
        for k, v in obj.items():
            # 🔁 Rename keys
            if k == "time":
                k = "prep_time"
            elif k == "cook_time":
                k = "cooking_time"
            elif k == "yield":
                k = "yields"

            new_obj[k] = clean_invalid_values(v)
        
        # 🎯 Add random mood if it's a recipe-like dictionary
        if "name" in new_obj or "recipe_name" in new_obj:
            new_obj["mood"] = random.choice(moods)
        return new_obj

    elif isinstance(obj, list):
        return [clean_invalid_values(v) for v in obj]
    elif obj is None or (isinstance(obj, float) and math.isnan(obj)):
        return None
    elif obj == float('inf') or obj == float('-inf'):
        return None
    return obj

try:
    # 🧠 Try tolerant parsing
    with open(input_path, "r", encoding="utf-8") as f:
        raw_data = f.read()
        data = json5.loads(raw_data)  # json5 handles small format issues

    cleaned_data = clean_invalid_values(data)

    # 💾 Save updated JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Cleaned, mood-added JSON saved to: {output_path}")

except Exception as e:
    print(f"❌ Error cleaning file: {e}")


