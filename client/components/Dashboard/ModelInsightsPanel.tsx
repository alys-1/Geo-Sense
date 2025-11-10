import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Loader, TrendingUp, AlertCircle } from "lucide-react";
import { flaskML } from "@/api/flask_ml";

interface ModelInsightsPanelProps {
  selectedZone: any;
}

const ModelInsightsPanel = ({ selectedZone }: ModelInsightsPanelProps) => {
  const [featureImportance, setFeatureImportance] = useState<any>(null);
  const [pcaData, setPcaData] = useState<any>(null);
  const [confusionMatrix, setConfusionMatrix] = useState<any>(null);
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadModelInsights = async () => {
      setIsLoading(true);
      try {
        const [featureImp, pca, cm, status] = await Promise.all([
          flaskML.getFeatureImportance(),
          flaskML.getPCAVisualization(),
          flaskML.getConfusionMatrix(),
          flaskML.getModelStatus(),
        ]);

        setFeatureImportance(featureImp);
        setPcaData(pca);
        setConfusionMatrix(cm);
        setModelStatus(status);
      } catch (error) {
        console.error("Error loading model insights:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModelInsights();
  }, [selectedZone]);

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700 p-6">
        <div className="flex items-center justify-center h-96">
          <Loader className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Status */}
      {modelStatus && (
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Model Status
          </h3>
          <div className="space-y-2">
            <p className="text-slate-300">
              Status:{" "}
              <span className="font-semibold text-cyan-400">
                {modelStatus.status}
              </span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {modelStatus.zones.map((zone: string) => (
                <div
                  key={zone}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: modelStatus.zone_colors[zone] + "30",
                    borderLeft: `3px solid ${modelStatus.zone_colors[zone]}`,
                  }}
                >
                  <span style={{ color: modelStatus.zone_colors[zone] }}>
                    {zone}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Feature Importance Chart */}
      {featureImportance && (
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">
              Feature Importance
            </h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Importance scores from Random Forest classifier
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureImportance.chart_data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94A3B8" />
              <YAxis
                dataKey="feature"
                type="category"
                stroke="#94A3B8"
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #475569",
                }}
                labelStyle={{ color: "#E2E8F0" }}
              />
              <Bar dataKey="importance" fill="#06B6D4" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* PCA Visualization */}
      {pcaData && (
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            PCA Cluster Visualization
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Variance explained:{" "}
            {(pcaData.total_variance_explained * 100).toFixed(1)}%
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="x"
                stroke="#94A3B8"
                label={{
                  value: "PC1",
                  position: "insideBottomRight",
                  offset: -5,
                }}
              />
              <YAxis
                dataKey="y"
                stroke="#94A3B8"
                label={{ value: "PC2", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #475569",
                }}
                labelStyle={{ color: "#E2E8F0" }}
              />
              {pcaData.zone_types.map((zone: string, index: number) => (
                <Scatter
                  key={zone}
                  name={zone}
                  dataKey="label"
                  data={pcaData.points.filter((p: any) => p.label === zone)}
                  fill={pcaData.zone_colors[index]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Confusion Matrix */}
      {confusionMatrix && (
        <Card className="bg-slate-800 border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">
              Model Performance
            </h3>
          </div>
          <div className="mb-6">
            <p className="text-sm text-slate-400 mb-2">Overall Accuracy</p>
            <div className="text-3xl font-bold text-cyan-400">
              {(confusionMatrix.accuracy * 100).toFixed(1)}%
            </div>
          </div>

          {/* Confusion Matrix Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-2 py-2 text-slate-300">
                    Predicted →
                  </th>
                  {confusionMatrix.labels.map((label: string) => (
                    <th
                      key={label}
                      className="text-center px-2 py-2 text-slate-300"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confusionMatrix.matrix.map((row: number[], idx: number) => (
                  <tr key={idx}>
                    <td className="text-left px-2 py-2 text-slate-300 font-medium">
                      {confusionMatrix.labels[idx]}
                    </td>
                    {row.map((cell: number, cellIdx: number) => (
                      <td
                        key={cellIdx}
                        className="text-center px-2 py-2 text-white font-semibold"
                        style={{
                          backgroundColor:
                            idx === cellIdx ? "#3B82F630" : "#6B7280" + "15",
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            {confusionMatrix.labels.map((label: string) => (
              <div key={label} className="bg-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-2">{label}</p>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-slate-400">Precision: </span>
                    <span className="font-semibold text-cyan-400">
                      {(confusionMatrix.precision[label] * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Recall: </span>
                    <span className="font-semibold text-green-400">
                      {(confusionMatrix.recall[label] * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">F1: </span>
                    <span className="font-semibold text-amber-400">
                      {(confusionMatrix.f1_score[label] * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ModelInsightsPanel;
