import axios from "axios";

// Gemini API configuration
const GEMINI_API_KEY = import.meta.env.REACT_APP_GEMINI_API_KEY || "demo";
const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface ZoneSummaryInput {
  zoneName: string;
  category: string;
  poiCount: number;
  trafficIntensity: number;
  confidenceScore: number;
  mobilityPattern: string;
  dominantPOIType?: string;
}

/**
 * Generate AI-powered insights about a zone using Gemini
 */
export const generateZoneSummary = async (
  zoneData: ZoneSummaryInput,
): Promise<string> => {
  try {
    const prompt = `Analyze the following urban zone in Pune and provide a brief, insightful summary (2-3 sentences):

Zone Name: ${zoneData.zoneName}
Classification: ${zoneData.category}
Total POIs: ${zoneData.poiCount}
Traffic Intensity: ${zoneData.trafficIntensity}%
Confidence Score: ${(zoneData.confidenceScore * 100).toFixed(0)}%
Mobility Pattern: ${zoneData.mobilityPattern}
${zoneData.dominantPOIType ? `Dominant POI Type: ${zoneData.dominantPOIType}` : ""}

Provide practical insights about what this zone is, typical characteristics, and recommendations for navigation or activities.`;

    const response = await axios.post(
      `${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data.candidates && response.data.candidates.length > 0) {
      const content = response.data.candidates[0].content.parts[0].text;
      return content;
    }

    return "Unable to generate insights at this moment. Please try again.";
  } catch (error) {
    console.error("Error generating Gemini summary:", error);
    // Return a fallback summary
    return `${zoneData.zoneName} is a ${zoneData.category.toLowerCase()} zone with ${zoneData.poiCount} points of interest. The area experiences ${zoneData.mobilityPattern.toLowerCase()}, with a traffic intensity of ${zoneData.trafficIntensity}%. This classification has a confidence score of ${(zoneData.confidenceScore * 100).toFixed(0)}% based on POI density and traffic patterns.`;
  }
};

/**
 * Generate safety recommendations for a route
 */
export const generateSafetyRecommendations = async (
  routeDescription: string,
  safetyScore: number,
  incidents: string[] = [],
): Promise<string> => {
  try {
    const incidentInfo =
      incidents.length > 0
        ? `Recent incidents: ${incidents.join(", ")}`
        : "No recent incidents reported";

    const prompt = `Provide safety recommendations for the following route in Pune:

Route: ${routeDescription}
Safety Score: ${safetyScore}/100
${incidentInfo}

Give practical, actionable safety tips for this route (2-3 sentences).`;

    const response = await axios.post(
      `${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data.candidates && response.data.candidates.length > 0) {
      return response.data.candidates[0].content.parts[0].text;
    }

    return "Safety recommendations unavailable. Please check official channels for route safety information.";
  } catch (error) {
    console.error("Error generating safety recommendations:", error);
    return "Unable to generate safety recommendations at this moment. Stay cautious and follow traffic rules.";
  }
};
