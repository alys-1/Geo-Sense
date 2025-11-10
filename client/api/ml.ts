export interface AnalyzeRequest {
  lat: number;
  lon: number;
  radius?: number;
}

export async function mlHealth() {
  const resp = await fetch("/api/ml/health");
  if (!resp.ok) throw new Error("ML health failed");
  return resp.json();
}

export async function mlAnalyze(body: AnalyzeRequest) {
  const resp = await fetch("/api/ml/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || "Analyze failed");
  }
  return resp.json();
}


