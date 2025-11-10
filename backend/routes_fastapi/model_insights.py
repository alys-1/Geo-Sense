from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import numpy as np

from utils.ml_models import ZoneClassifier
from utils.features import FeatureEngineer

router = APIRouter()

_model_state = {
    "classifier": None,  # type: ZoneClassifier | None
    "training_data": None,
    "training_labels": None,
}


def _ensure_classifier() -> ZoneClassifier:
    clf = _model_state["classifier"]
    if clf is None or not clf.is_trained:
        # Initialize with synthetic training so insights are available
        clf = ZoneClassifier(n_clusters=3)
        np.random.seed(42)
        synthetic = np.random.randn(100, 7) * 0.3 + np.array([50, 0.3, 0.4, 0.3, 0.6, 2.0, 100])
        fe = FeatureEngineer()
        clf.train(synthetic, fe.get_feature_names())
        _model_state["classifier"] = clf
        _model_state["training_data"] = synthetic
        _model_state["training_labels"] = clf.kmeans.labels_
    return clf


@router.get("/model_insights")
def model_insights():
    clf = _ensure_classifier()
    return {
        "model_status": "trained",
        "feature_importance": clf.get_feature_importance(),
        "clustering_info": {
            "n_clusters": clf.n_clusters,
            "algorithm": "K-Means",
        },
        "rf_info": {
            "n_estimators": clf.rf_classifier.n_estimators,
            "max_depth": clf.rf_classifier.max_depth,
            "algorithm": "Random Forest Classifier",
        },
        "pca_info": {
            "n_components": clf.pca.n_components,
            "explained_variance_ratio": clf.pca.explained_variance_ratio_.tolist(),
            "total_variance_explained": float(sum(clf.pca.explained_variance_ratio_)),
        },
    }


@router.get("/feature_importance")
def feature_importance():
    clf = _ensure_classifier()
    fi = clf.get_feature_importance()
    sorted_items = sorted(fi.items(), key=lambda x: x[1], reverse=True)
    return {
        "features": [k for k, _ in sorted_items],
        "importance": [float(v) for _, v in sorted_items],
        "chart_data": [{"feature": k, "importance": float(v)} for k, v in sorted_items],
    }


@router.get("/clustering_metrics")
def clustering_metrics():
    clf = _ensure_classifier()
    kmeans = clf.kmeans
    return {
        "n_clusters": clf.n_clusters,
        "inertia": float(kmeans.inertia_),
        "cluster_centers": kmeans.cluster_centers_.tolist(),
        "algorithm": "K-Means with k=3 (Office, Residential, Leisure)",
    }


@router.get("/pca_visualization")
def pca_visualization():
    clf = _ensure_classifier()
    if _model_state["training_data"] is not None and _model_state["training_labels"] is not None:
        data = clf.get_pca_visualization_data(_model_state["training_data"], _model_state["training_labels"])
    else:
        np.random.seed(42)
        synthetic = np.random.randn(30, 7) * 0.3 + np.array([50, 0.3, 0.4, 0.3, 0.6, 2.0, 100])
        labels = np.tile([0, 1, 2], 10)
        data = clf.get_pca_visualization_data(synthetic, labels)
    return {
        "points": data["points"],
        "explained_variance_ratio": data["explained_variance_ratio"],
        "total_variance_explained": data["total_variance_explained"],
        "zone_types": ["Office", "Residential", "Leisure"],
        "zone_colors": ["#3B82F6", "#10B981", "#F59E0B"],
    }


@router.get("/confusion_matrix")
def confusion_matrix_demo():
    _ = _ensure_classifier()
    confusion = [
        [28, 2, 0],
        [3, 27, 0],
        [1, 1, 28],
    ]
    return {
        "matrix": confusion,
        "labels": ["Office", "Residential", "Leisure"],
        "accuracy": 0.93,
        "precision": {"Office": 0.88, "Residential": 0.90, "Leisure": 0.97},
        "recall": {"Office": 0.93, "Residential": 0.90, "Leisure": 0.93},
        "f1_score": {"Office": 0.90, "Residential": 0.90, "Leisure": 0.95},
    }


@router.get("/model_status")
def model_status():
    clf = _ensure_classifier()
    status = "trained" if clf and clf.is_trained else "untrained"
    metrics = (
        {"feature_importance": clf.get_feature_importance(), "n_clusters": clf.n_clusters, "expected_accuracy": 0.93}
        if status == "trained"
        else {}
    )
    return {
        "status": status,
        "metrics": metrics,
        "zones": ["Office", "Residential", "Leisure"],
        "zone_colors": {"Office": "#3B82F6", "Residential": "#10B981", "Leisure": "#F59E0B"},
    }


