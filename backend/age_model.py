import onnxruntime as ort
import numpy as np
import base64
from PIL import Image
import io


session = ort.InferenceSession("models/age_model.onnx")
input_name = session.get_inputs()[0].name


def preprocess_image(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((224, 224))  

    img = np.array(img).astype(np.float32)
    img = img / 255.0
    img = np.transpose(img, (2, 0, 1))  
    img = np.expand_dims(img, axis=0)

    return img


def predict_age_bucket(base64_image):

    try:
        header, encoded = base64_image.split(",", 1)
        image_bytes = base64.b64decode(encoded)

        input_tensor = preprocess_image(image_bytes)
        outputs = session.run(None, {input_name: input_tensor})

        age_class = int(np.argmax(outputs[0]))

        # Map class → bucket
        if age_class <= 2:
            bucket = "1-3"
        elif age_class <= 5:
            bucket = "4-5"
        elif age_class <= 12:
            bucket = "6-12"
        else:
            bucket = "Age higher than 12"

        
        print("\n===============================")
        print("🎯 AGE PREDICTION")
        print("Raw model output:", outputs[0])
        print("Predicted class index:", age_class)
        print("Mapped age bucket:", bucket)
        print("===============================\n")

        return bucket

    except Exception as e:
        print("❌ Age Model Error:", str(e))
        raise