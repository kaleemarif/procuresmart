"""Waiting-time prediction utilities."""

from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd

from .config import ALL_FEATURES, MODEL_PATH


def load_model(model_path: str | Path = MODEL_PATH):
    """Load the trained model from disk."""

    path = Path(model_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Trained model not found: {path}. "
            "Run the training script first."
        )

    return joblib.load(path)


def predict_waiting_time(
    input_data: dict,
    model_path: str | Path = MODEL_PATH,
) -> float:
    """
    Predict waiting time in minutes for one procurement-centre situation.
    """

    missing_features = [
        feature
        for feature in ALL_FEATURES
        if feature not in input_data
    ]

    if missing_features:
        raise ValueError(
            f"Missing features: {missing_features}"
        )

    model = load_model(model_path)

    df = pd.DataFrame(
        [input_data],
        columns=ALL_FEATURES,
    )

    prediction = model.predict(df)[0]

    return round(float(prediction), 2)
