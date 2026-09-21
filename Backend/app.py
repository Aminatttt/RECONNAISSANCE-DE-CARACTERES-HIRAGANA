from flask import Flask, request, jsonify
from flask_cors import CORS 

import cv2
import numpy as np
import base64

from skimage.feature import hog
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)


model = joblib.load("best_knn_model.pkl")
class_map = pd.read_csv("kmnist_classmap.csv")


@app.route("/")
def home():
    return "Flask is running"

@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    image = data["image"]

    image = image.split(",")[1]

    image_bytes = base64.b64decode(image)

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)

    img = cv2.imdecode(image_array, cv2.IMREAD_UNCHANGED)  # b alpha

    if img.ndim == 3 and img.shape[2] == 4:
        # Flatten 3la background abyad
        bgr = img[:, :, :3]
        alpha = img[:, :, 3] / 255.0
        white_bg = np.ones_like(bgr, dtype=np.uint8) * 255
        bgr = (bgr * alpha[..., None] + white_bg * (1 - alpha[..., None])).astype(np.uint8)
        img = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    elif img.ndim == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # else: déjà grayscale, khalih kama howa

    # Threshold bach tban binaire clean
    _, img = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)

    # Dilate l khat bach ma ytkhtafch mora l resize
    kernel = np.ones((5, 5), np.uint8)
    img = cv2.dilate(img, kernel, iterations=1)

    # INTER_AREA howa best bach t-shrink (khsosan strokes ra9a9)
    img = cv2.resize(img, (28, 28), interpolation=cv2.INTER_AREA)

    # img = cv2.resize(img, (28,28))

    img = img.astype(np.float32) / 255.0

    # Inverser les couleurs
    img = 1.0 - img

    feature = hog(
        img,
        orientations=9,
        pixels_per_cell=(4,4),
        cells_per_block=(2,2),
        block_norm="L2-Hys"
    )
    feature = feature.reshape(1, -1)

    print(feature.shape)
    
    print("Prediction label:", prediction)

    character = class_map.loc[prediction, "char"]
    print("Character:", character)

    probabilities = model.predict_proba(feature)[0]
    print(probabilities)
    confidence = probabilities[prediction] * 100


    print("Shape :", img.shape)

    print("Min :", img.min())

    print("Max :", img.max())

    return jsonify({
        "prediction": character,

        "confidence": round(float(confidence),2)
    })

if __name__ == "__main__":
    app.run(debug=True)