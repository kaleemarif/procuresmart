"""Train the ProcureSmart waiting-time prediction model."""

from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from .config import (
    ALL_FEATURES,
    ARTIFACTS_DIR,
    DATASET_VERSION,
    MODEL_PATH,
    TARGET_COLUMN,
)
from .preprocess import build_preprocessor


def load_dataset(csv_path: str | Path) -> pd.DataFrame:
    """Load and validate the training dataset."""

    path = Path(csv_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found: {path}"
        )

    df = pd.read_csv(path)

    required_columns = ALL_FEATURES + [TARGET_COLUMN]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    return df


def train_model(df: pd.DataFrame) -> tuple[Pipeline, dict]:
    """Train and evaluate the Random Forest model."""

    X = df[ALL_FEATURES]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
    )

    preprocessor = build_preprocessor()

    model = RandomForestRegressor(
        n_estimators=200,
        random_state=42,
        n_jobs=-1,
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )

    pipeline.fit(X_train, y_train)

    predictions = pipeline.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = mean_squared_error(
        y_test,
        predictions,
    ) ** 0.5
    r2 = r2_score(y_test, predictions)

    metrics = {
        "dataset_version": DATASET_VERSION,
        "training_rows": len(X_train),
        "test_rows": len(X_test),
        "mae_minutes": round(float(mae), 4),
        "rmse_minutes": round(float(rmse), 4),
        "r2": round(float(r2), 4),
    }

    return pipeline, metrics


def save_model(model: Pipeline) -> None:
    """Save the trained model."""

    ARTIFACTS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(model, MODEL_PATH)

    print(f"Model saved to: {MODEL_PATH}")


def main() -> None:
    """Run the complete training process."""

    parser = argparse.ArgumentParser(
        description="Train ProcureSmart waiting-time model."
    )

    parser.add_argument(
        "--data",
        required=True,
        help="Path to the synthetic training CSV.",
    )

    args = parser.parse_args()

    print("Loading dataset...")
    df = load_dataset(args.data)

    print(f"Dataset rows: {len(df)}")
    print(f"Dataset version: {DATASET_VERSION}")

    print("Training Random Forest model...")
    model, metrics = train_model(df)

    print("\nEvaluation:")
    print(f"MAE  : {metrics['mae_minutes']} minutes")
    print(f"RMSE : {metrics['rmse_minutes']} minutes")
    print(f"R²   : {metrics['r2']}")

    save_model(model)

    print("\nTraining completed successfully.")


if __name__ == "__main__":
    main()
