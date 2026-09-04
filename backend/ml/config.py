"""Configuration for the ProcureSmart ML pipeline."""

from pathlib import Path


# Directory containing this file
ML_DIR = Path(__file__).resolve().parent

# Directory for trained model artifacts
ARTIFACTS_DIR = ML_DIR / "artifacts"

# Default trained model path
MODEL_PATH = ARTIFACTS_DIR / "waiting_time_model.joblib"

# Dataset information
DATASET_VERSION = "synthetic_prototype_v1"

# Target column
TARGET_COLUMN = "waiting_time"

# Features used by the model
NUMERIC_FEATURES = [
    "quantity_quintals",
    "queue_length",
    "active_counters",
    "avg_processing_time",
    "capacity_used_pct",
    "hour",
    "day_of_week",
]

CATEGORICAL_FEATURES = [
    "centre_id",
    "crop",
    "weather",
]

ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
