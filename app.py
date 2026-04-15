import io
import sys
import json
import base64

# ─── Startup dependency check ───────────────────────────────────────────────
def check_dependencies():
    missing = []
    try:
        from flask import Flask
        from flask_cors import CORS
    except ImportError as e:
        missing.append(str(e))
    try:
        from google import genai
    except ImportError:
        missing.append("google-genai  →  pip install google-genai")
    try:
        from PIL import Image
    except ImportError:
        missing.append("Pillow  →  pip install Pillow")

    if missing:
        print("\n❌  MISSING PACKAGES — install them and restart:\n")
        for m in missing:
            print(f"   pip install {m}")
        print()
        sys.exit(1)

check_dependencies()
# ─────────────────────────────────────────────────────────────────────────────

from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from PIL import Image

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024

# ── Initialize Gemini client ──────────────────────────────────────────────────
API_KEY = "AIzaSyBut99JEGQDjyr_XUWw_EFIZmLMWpZdUGM"
try:
    client = genai.Client(api_key=API_KEY)
    print("✅  Gemini client initialized.")
except Exception as e:
    print(f"❌  Gemini client init failed: {e}")
    sys.exit(1)

GEMINI_MODEL = "gemini-2.5-flash"


# ── Helper: parse AI response ─────────────────────────────────────────────────
def parse_ai_response(text):
    clean = text.strip()
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
    clean = clean.strip()
    return json.loads(clean)


# ── Build gender-specific prompts ─────────────────────────────────────────────
def build_photo_prompt(occasion):
    return (
        f"Act as a professional makeup artist. Analyse this face for a {occasion} look. "
        "Return ONLY a valid JSON object with exactly these keys: "
        '"skin_type", "skincare", "makeup", "products". '
        "skin_type: describe skin type, tone, undertone and any concerns. "
        "skincare: step-by-step skincare prep for the look. "
        "makeup: complete makeup application instructions for the {occasion} occasion. "
        "products: JSON array of budget-friendly Indian makeup product strings. "
        "No markdown, no extra text."
    )


def build_profile_prompt(tone, undertone, skin_type, concerns, occasion):
    return (
        "Act as a professional makeup artist. "
        "A female user has described her skin profile below.\n\n"
        f"  Skin Tone   : {tone}\n"
        f"  Undertone   : {undertone}\n"
        f"  Skin Type   : {skin_type}\n"
        f"  Concerns    : {concerns}\n"
        f"  Occasion    : {occasion}\n\n"
        f"Create a complete, personalised {occasion} makeup look for this profile. "
        "Prefer budget-friendly Indian drugstore brands where possible. "
        "Return ONLY a valid JSON object with exactly these keys: "
        '"skin_type", "skincare", "makeup", "products". '
        "Products must be a JSON array of strings. No markdown, no extra text."
    )


# ── Routes ────────────────────────────────────────────────────────────────────
@app.route('/')
def home():
    return "✦ SmartGlam AI Engine is Online! (v2 - Gender Support)"


@app.route('/analyze', methods=['POST'])
def analyze():
    print("─── /analyze  (photo mode) ──────────────────────────────")
    try:
        data = request.get_json()
        if not data or "image" not in data:
            return jsonify({"error": "No image data provided"}), 400

        base64_image = data.get("image", "")
        occasion     = data.get("occasion", "Casual")

        if "," in base64_image:
            base64_image = base64_image.split(",")[1]

        img_bytes = base64.b64decode(base64_image)
        img       = Image.open(io.BytesIO(img_bytes))
        prompt    = build_photo_prompt(occasion)

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[prompt, img]
        )
        result = parse_ai_response(response.text)
        print("✅  Photo analysis complete.")
        return jsonify(result)

    except json.JSONDecodeError as e:
        msg = f"AI returned non-JSON response: {e}"
        print(f"❌  {msg}")
        return jsonify({"error": msg}), 500
    except Exception as e:
        print(f"❌  SERVER ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/analyze-profile', methods=['POST'])
def analyze_profile():
    print("─── /analyze-profile  (skin-tone mode) ─────────────────")
    try:
        data = request.get_json()
        if not data or "profile" not in data:
            return jsonify({"error": "No profile data provided"}), 400

        profile   = data.get("profile", {})
        occasion  = data.get("occasion", "Casual")

        tone      = profile.get("tone",      "Medium")
        undertone = profile.get("undertone", "Neutral")
        skin_type = profile.get("skinType",  "Normal")
        concerns  = ", ".join(profile.get("concerns", ["None"]))

        prompt = build_profile_prompt(tone, undertone, skin_type, concerns, occasion)

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[prompt]
        )
        result = parse_ai_response(response.text)
        print("✅  Profile analysis complete.")
        return jsonify(result)

    except json.JSONDecodeError as e:
        msg = f"AI returned non-JSON response: {e}"
        print(f"❌  {msg}")
        return jsonify({"error": msg}), 500
    except Exception as e:
        print(f"❌  SERVER ERROR: {e}")
        return jsonify({"error": str(e)}), 500


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("\n✦  SmartGlam AI Server v2 starting on http://127.0.0.1:5000\n")
    app.run(debug=True, port=5000, host='127.0.0.1')
