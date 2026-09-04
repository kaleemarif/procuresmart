"""Model evaluation utilities."""

from __future__ import annotations

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)


def calculate_metrics(
    actual,
    predicted,
) -> dict:
    """Calculate standard regression metrics."""

    mae = mean_absolute_error(
        actual,
        predicted,
    )

    rmse = mean_squared_error(
        actual,
        predicted,
    ) ** 0.5

    r2 = r2_score(
        actual,
        predicted,
    )

    return {
        "mae_minutes": round(float(mae), 4),
        "rmse_minutes": round(float(rmse), 4),
        "r2": round(float(r2), 4),
    }
