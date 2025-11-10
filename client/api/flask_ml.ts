import axios from "axios";

const FLASK_BASE_URL = "http://localhost:5000/api";

export interface ZoneAnalysis {
  location: {
    lat: number;
    lon: number;
    radius: number;
  };
  zone_classification: {
    zone_type: string;
    zone_color: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  features: {
    values: Record<string, number>;
    poi_count: number;
    dominant_category: string;
  };
  traffic: {
    current_speed: number | null;
    free_flow_speed: number | null;
    traffic_ratio: number;
    confidence: number | null;
  };
  model_insights: {
    feature_importance: Record<string, number>;
    kmeans_cluster: number;
    kmeans_distance: number;
    pca_coordinates: [number, number];
  };
}

export interface POIData {
  lat: number;
  lon: number;
  radius: number;
  count: number;
  pois: any[];
}

export interface TrafficData {
  lat: number;
  lon: number;
  current_speed: number | null;
  free_flow_speed: number | null;
  traffic_ratio: number;
  confidence: number | null;
}

export interface FeaturesResponse {
  location: {
    lat: number;
    lon: number;
    radius: number;
  };
  raw_features: Record<string, number>;
  normalized_features: Record<string, number>;
  feature_names: string[];
}

export interface ModelInsights {
  model_status: string;
  feature_importance: Record<string, number>;
  clustering_info: {
    n_clusters: number;
    algorithm: string;
  };
  rf_info: {
    n_estimators: number;
    max_depth: number;
    algorithm: string;
  };
  pca_info: {
    n_components: number;
    explained_variance_ratio: number[];
    total_variance_explained: number;
  };
}

export interface PCAVisualization {
  points: Array<{
    x: number;
    y: number;
    label: string;
    color: string;
  }>;
  explained_variance_ratio: number[];
  total_variance_explained: number;
  zone_types: string[];
  zone_colors: string[];
}

export interface ConfusionMatrixData {
  matrix: number[][];
  labels: string[];
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1_score: Record<string, number>;
}

export const flaskML = {
  // Data Fetching
  async fetchPOI(
    lat: number,
    lon: number,
    radius: number = 1000,
  ): Promise<POIData> {
    try {
      const response = await axios.post(`${FLASK_BASE_URL}/fetch_poi`, {
        lat,
        lon,
        radius,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching POI from Flask:", error);
      throw error;
    }
  },

  async fetchTraffic(lat: number, lon: number): Promise<TrafficData> {
    try {
      const response = await axios.post(`${FLASK_BASE_URL}/fetch_traffic`, {
        lat,
        lon,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching traffic from Flask:", error);
      throw error;
    }
  },

  async getMapData(lat: number, lon: number, radius: number = 1000) {
    try {
      const response = await axios.post(`${FLASK_BASE_URL}/map_data`, {
        lat,
        lon,
        radius,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching map data from Flask:", error);
      throw error;
    }
  },

  // Zone Analysis & Classification
  async analyzeZone(
    lat: number,
    lon: number,
    radius: number = 1000,
  ): Promise<ZoneAnalysis> {
    try {
      const response = await axios.post(`${FLASK_BASE_URL}/analyze`, {
        lat,
        lon,
        radius,
      });
      return response.data;
    } catch (error) {
      console.error("Error analyzing zone from Flask:", error);
      throw error;
    }
  },

  // Feature Engineering
  async getFeatures(
    lat: number,
    lon: number,
    radius: number = 1000,
  ): Promise<FeaturesResponse> {
    try {
      const response = await axios.post(`${FLASK_BASE_URL}/features`, {
        lat,
        lon,
        radius,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching features from Flask:", error);
      throw error;
    }
  },

  // Model Insights
  async getModelInsights(): Promise<ModelInsights> {
    try {
      const response = await axios.get(`${FLASK_BASE_URL}/model_insights`);
      return response.data;
    } catch (error) {
      console.error("Error fetching model insights from Flask:", error);
      throw error;
    }
  },

  async getFeatureImportance(): Promise<{
    features: string[];
    importance: number[];
    chart_data: any[];
  }> {
    try {
      const response = await axios.get(`${FLASK_BASE_URL}/feature_importance`);
      return response.data;
    } catch (error) {
      console.error("Error fetching feature importance from Flask:", error);
      throw error;
    }
  },

  async getClusteringMetrics() {
    try {
      const response = await axios.get(`${FLASK_BASE_URL}/clustering_metrics`);
      return response.data;
    } catch (error) {
      console.error("Error fetching clustering metrics from Flask:", error);
      throw error;
    }
  },

  async getPCAVisualization(): Promise<PCAVisualization> {
    try {
      const response = await axios.get(`${FLASK_BASE_URL}/pca_visualization`);
      return response.data;
    } catch (error) {
      console.error("Error fetching PCA visualization from Flask:", error);
      throw error;
    }
  },

  async getConfusionMatrix(): Promise<ConfusionMatrixData> {
    try {
      const response = await axios.get(`${FLASK_BASE_URL}/confusion_matrix`);
      return response.data;
    } catch (error) {
      console.error("Error fetching confusion matrix from Flask:", error);
      throw error;
    }
  },

  async getModelStatus() {
    try {
      const response = await axios.get(`${FLASK_BASE_URL}/model_status`);
      return response.data;
    } catch (error) {
      console.error("Error fetching model status from Flask:", error);
      throw error;
    }
  },
};
