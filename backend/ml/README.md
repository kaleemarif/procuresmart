# ProcureSmart ML

This directory contains the machine-learning pipeline for ProcureSmart.

## Objective

Predict the expected waiting time at a procurement centre.

The current prototype uses a synthetic training dataset.

---

## Model

Current model:

- Random Forest Regressor
- 200 estimators
- Random state: 42
- 80/20 train-test split

---

## Features

### Numeric Features

- quantity_quintals
- queue_length
- active_counters
- avg_processing_time
- capacity_used_pct
- hour
- day_of_week

### Categorical Features

- centre_id
- crop
- weather

### Target

- waiting_time

The target represents the expected waiting time in minutes.

---

## Dataset

Current training dataset:

- Dataset version: `synthetic_prototype_v1`
- Records: 20,000
- Purpose: prototype model training and validation

The synthetic dataset is stored separately from production procurement data.

---

## Preprocessing

Numeric features are passed through unchanged.

Categorical features are converted using One-Hot Encoding.

The preprocessing and model are stored together inside a single scikit-learn Pipeline.

Unknown categorical values are handled safely using:

```python
handle_unknown="ignore"
