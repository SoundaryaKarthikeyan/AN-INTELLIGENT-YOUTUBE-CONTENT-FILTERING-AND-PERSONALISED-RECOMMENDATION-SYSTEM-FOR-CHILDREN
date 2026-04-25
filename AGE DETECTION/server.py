import io
import numpy as np
import onnxruntime as ort
from PIL import Image
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body
import base64

app = FastAPI()

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# LOAD ONNX MODEL
# =========================
MODEL_PATH = "age_model.onnx"
session = ort.InferenceSession(MODEL_PATH)

# =========================
# PREPROCESS
# =========================
def preprocess(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((224, 224))

    image = np.array(image).astype(np.float32) / 255.0

    # normalize (IMPORTANT)
    image = (image - 0.5) / 0.5

    image = np.transpose(image, (2, 0, 1))
    image = np.expand_dims(image, axis=0)

    return image

# =========================
# PREDICT
# =========================

@app.post("/predict")
async def predict_file(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()

        image = preprocess(image_bytes)

        input_name = session.get_inputs()[0].name
        outputs = session.run(None, {input_name: image})

        predicted_index = int(np.argmax(outputs[0]))

        age_group = ["1-3", "4-5", "6-12"][predicted_index]

        return {"age_group": age_group}

    except Exception as e:
        return {"error": str(e)}
    print(outputs[0])