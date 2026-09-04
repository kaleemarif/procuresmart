"""Preprocessing utilities for the ProcureSmart ML model."""

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder

from .config import CATEGORICAL_FEATURES, NUMERIC_FEATURES


def build_preprocessor() -> ColumnTransformer:
    """
    Build the preprocessing pipeline.

    Numeric features are passed through unchanged.
    Categorical features are one-hot encoded.
    """

    return ColumnTransformer(
        transformers=[
            (
                "numeric",
                "passthrough",
                NUMERIC_FEATURES,
            ),
            (
                "categorical",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="drop",
    )
