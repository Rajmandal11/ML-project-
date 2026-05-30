from flask import Flask, request, jsonify, render_template
import joblib
import numpy as np

app = Flask(__name__)

# ─── Load trained model once at startup ──────────────────────────────────────
model = joblib.load("model.pkl")

FEATURE_ORDER = [
    "area_sqft",
    "bedrooms",
    "bathrooms",
    "age_years",
    "garage_spaces",
    "distance_city",
    "has_pool",
    "school_rating",
]

# ─── Routes ───────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        payload = request.get_json(force=True)

        # Validate & extract features
        features = []
        for key in FEATURE_ORDER:
            if key not in payload:
                return jsonify({"error": f"Missing field: {key}"}), 400
            features.append(float(payload[key]))

        X = np.array(features).reshape(1, -1)
        price = model.predict(X)[0]

        # Confidence band: +/- 8%
        low  = price * 0.92
        high = price * 1.08

        return jsonify({
            "predicted_price": round(price, 2),
            "range_low":       round(low, 2),
            "range_high":      round(high, 2),
            "currency":        "USD",
        })

    except ValueError as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok", "model": "RandomForest-HousePrice-v1"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
