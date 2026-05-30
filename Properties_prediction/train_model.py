import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline
import joblib

np.random.seed(42)
n_samples = 3000

data = {
    "area_sqft" :     np.random.randint(500, 5000, n_samples),
    "bedrooms" :      np.random.randint(1, 6, n_samples),
    "bathrooms":      np.random.randint(1, 5, n_samples),
    "age_years":      np.random.randint(0, 50, n_samples),
    "garage_spaces":  np.random.randint(0, 4, n_samples),
    "city_distance":  np.round(np.random.uniform(1, 50, n_samples),1),
    "has_pool":       np.random.randint(0,2, n_samples),
    "school_rating":  np.round(np.random.uniform(1, 50, n_samples),1),
}
df = pd.DataFrame(data)

df["price"] = (
    df["area_sqft"] * 120
   + df["bedrooms"] * 8000
   + df["bathrooms"] * 6000
   + df["age_years"] * 1500
   + df["garage_spaces"] * 5000
   + df["city_distance"] * 2000
   + df["has_pool"] * 20000
   + df["school_rating"] * 10000
   + np.randon.normal(0, 20000, n_samples)).clip(50000, 200000)

X = df.drop("price", axis = 1)
y = df["price"]

X_train, X_test, y_train, y_test = train_test_split(X,y, test_size = 0.2, random_state = 39)

pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model", RandomForestRegressor( 
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=3,
        random_state=42,
        n_jobs=-1
    ))
])

pipeline.fit(X_train, y_train)

y_pred = pipeline.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"[Model Training Complete]")
print(f"  Mean Absolute Error : ${mae:,.0f}")
print(f"  R2 Score            : {r2:.4f}")

joblib.dump(pipeline, "model.pkl")
print("  Model saved to model.pkl")