import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import confusion_matrix, accuracy_score, classification_report
from typing import Dict, List, Tuple, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ZoneClassifier:
    """
    ML-based zone classifier using K-Means clustering and Random Forest classification.
    Predicts zone types: Office, Residential, Leisure
    """
    
    ZONE_LABELS = {
        0: "Office",
        1: "Residential",
        2: "Leisure"
    }
    
    ZONE_COLORS = {
        "Office": "#3B82F6",      # Blue
        "Residential": "#10B981",  # Green
        "Leisure": "#F59E0B"       # Orange
    }
    
    def __init__(self, n_clusters: int = 3, random_state: int = 42):
        self.n_clusters = n_clusters
        self.random_state = random_state
        self.kmeans = None
        self.rf_classifier = None
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=2)
        self.feature_names = []
        self.is_trained = False

    def train(self, feature_data: np.ndarray, feature_names: List[str]) -> Dict[str, Any]:
        """
        Train K-Means and Random Forest models on feature data.
        """
        try:
            self.feature_names = feature_names
            
            # Standardize features
            X_scaled = self.scaler.fit_transform(feature_data)
            
            # Train K-Means
            self.kmeans = KMeans(n_clusters=self.n_clusters, random_state=self.random_state, n_init=10)
            kmeans_labels = self.kmeans.fit_predict(X_scaled)
            
            # Calculate silhouette score
            from sklearn.metrics import silhouette_score
            silhouette = silhouette_score(X_scaled, kmeans_labels)
            
            # Train Random Forest with K-Means labels as synthetic targets
            self.rf_classifier = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=self.random_state,
                n_jobs=-1
            )
            self.rf_classifier.fit(X_scaled, kmeans_labels)
            
            # Calculate accuracy
            rf_predictions = self.rf_classifier.predict(X_scaled)
            accuracy = accuracy_score(kmeans_labels, rf_predictions)
            
            # PCA for visualization
            X_pca = self.pca.fit_transform(X_scaled)
            
            self.is_trained = True
            
            results = {
                "kmeans": {
                    "n_clusters": self.n_clusters,
                    "inertia": float(self.kmeans.inertia_),
                    "silhouette_score": float(silhouette),
                    "cluster_centers": self.kmeans.cluster_centers_.tolist()
                },
                "random_forest": {
                    "accuracy": float(accuracy),
                    "n_estimators": self.rf_classifier.n_estimators,
                    "feature_importance": dict(zip(feature_names, self.rf_classifier.feature_importances_.tolist()))
                },
                "pca": {
                    "explained_variance_ratio": self.pca.explained_variance_ratio_.tolist(),
                    "total_variance_explained": float(sum(self.pca.explained_variance_ratio_))
                }
            }
            
            logger.info("Models trained successfully")
            return results
        except Exception as e:
            logger.error(f"Error training models: {e}")
            raise

    def predict(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Predict zone type for a single location.
        """
        if not self.is_trained:
            raise ValueError("Models must be trained before prediction")
        
        try:
            # Convert features to array in correct order
            feature_array = np.array([[features.get(name, 0) for name in self.feature_names]])
            
            # Standardize
            X_scaled = self.scaler.transform(feature_array)
            
            # K-Means prediction
            kmeans_label = self.kmeans.predict(X_scaled)[0]
            kmeans_distance = float(np.min(np.linalg.norm(X_scaled - self.kmeans.cluster_centers_, axis=1)))
            
            # Random Forest prediction with probabilities
            rf_label = self.rf_classifier.predict(X_scaled)[0]
            rf_proba = self.rf_classifier.predict_proba(X_scaled)[0]
            
            # PCA projection for visualization
            X_pca = self.pca.transform(X_scaled)[0]
            
            prediction = {
                "zone_type": self.ZONE_LABELS.get(int(rf_label), "Unknown"),
                "zone_color": self.ZONE_COLORS.get(self.ZONE_LABELS.get(int(rf_label), "Unknown"), "#999999"),
                "confidence": float(np.max(rf_proba)),
                "probabilities": {
                    self.ZONE_LABELS[i]: float(prob)
                    for i, prob in enumerate(rf_proba)
                },
                "kmeans_cluster": int(kmeans_label),
                "kmeans_distance": kmeans_distance,
                "pca_coordinates": X_pca.tolist(),
                "features": features
            }
            
            return prediction
        except Exception as e:
            logger.error(f"Error in prediction: {e}")
            raise

    def predict_batch(self, features_list: List[Dict[str, float]]) -> List[Dict[str, Any]]:
        """Predict zone types for multiple locations."""
        predictions = []
        for features in features_list:
            pred = self.predict(features)
            predictions.append(pred)
        return predictions

    def get_feature_importance(self) -> Dict[str, float]:
        """Get Random Forest feature importance."""
        if not self.rf_classifier:
            return {}
        
        importance_dict = dict(zip(
            self.feature_names,
            self.rf_classifier.feature_importances_.tolist()
        ))
        
        # Sort by importance
        return dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))

    def get_confusion_matrix_data(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
        """Generate confusion matrix data."""
        cm = confusion_matrix(y_true, y_pred)
        
        return {
            "matrix": cm.tolist(),
            "labels": [self.ZONE_LABELS.get(i, f"Class {i}") for i in range(len(cm))],
            "accuracy": float(accuracy_score(y_true, y_pred))
        }

    def get_pca_visualization_data(self, feature_data: np.ndarray, labels: np.ndarray) -> Dict[str, Any]:
        """Get PCA data for visualization."""
        X_scaled = self.scaler.transform(feature_data)
        X_pca = self.pca.transform(X_scaled)
        
        data = {
            "points": [
                {
                    "x": float(point[0]),
                    "y": float(point[1]),
                    "label": self.ZONE_LABELS.get(int(label), "Unknown"),
                    "color": self.ZONE_COLORS.get(self.ZONE_LABELS.get(int(label), "Unknown"), "#999999")
                }
                for point, label in zip(X_pca, labels)
            ],
            "explained_variance_ratio": self.pca.explained_variance_ratio_.tolist(),
            "total_variance_explained": float(sum(self.pca.explained_variance_ratio_))
        }
        
        return data
