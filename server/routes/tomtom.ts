import { RequestHandler } from "express";
import axios from "axios";

const TOMTOM_API_KEY =
  process.env.REACT_APP_TOMTOM_API_KEY || "X47KFIvPV5LB2FKHlVI7zIdaOU3GoUQ9";
const TOMTOM_BASE_URL = "https://api.tomtom.com";

export const searchAreas: RequestHandler = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const response = await axios.get(
      `${TOMTOM_BASE_URL}/search/2/search.json`,
      {
        params: {
          key: TOMTOM_API_KEY,
          query,
          limit: 10,
        },
      },
    );

    res.json(response.data.results || []);
  } catch (error: any) {
    console.error("Error searching areas:", error.message);
    res.status(500).json({ error: "Failed to search areas" });
  }
};

export const searchPOIs: RequestHandler = async (req, res) => {
  try {
    const { lat, lon, radius, query } = req.query;

    if (!lat || !lon) {
      return res
        .status(400)
        .json({ error: "lat and lon parameters are required" });
    }

    const response = await axios.get(
      `${TOMTOM_BASE_URL}/search/2/nearby.json`,
      {
        params: {
          key: TOMTOM_API_KEY,
          lat,
          lon,
          radius: radius || 5000,
          limit: 50,
          ...(query && { query }),
        },
      },
    );

    const pois = (response.data.results || []).map((result: any) => ({
      id: result.id,
      name: result.poi?.name || result.address?.streetName || "Unknown",
      type: result.poi?.classifications?.[0]?.name || "Unknown",
      position: {
        lat: result.position.lat,
        lon: result.position.lon,
      },
      address: result.address?.freeformAddress,
    }));

    res.json(pois);
  } catch (error: any) {
    console.error("Error fetching POIs:", error.message);
    res.status(500).json({ error: "Failed to fetch POIs" });
  }
};

export const getTrafficFlow: RequestHandler = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res
        .status(400)
        .json({ error: "lat and lon parameters are required" });
    }

    const response = await axios.get(
      `${TOMTOM_BASE_URL}/traffic/services/4/flowSegmentData/absolute/10/json`,
      {
        params: {
          key: TOMTOM_API_KEY,
          point: `${lat},${lon}`,
        },
      },
    );

    const flowData = (response.data.flowSegmentData || []).map(
      (segment: any) => ({
        id: segment.segmentId,
        speedKmH: segment.currentSpeed,
        freeFlowSpeedKmH: segment.freeFlowSpeed,
        currentSpeed: segment.currentSpeed,
        position: {
          lat: segment.coordinates[0][1],
          lon: segment.coordinates[0][0],
        },
      }),
    );

    res.json(flowData);
  } catch (error: any) {
    console.error("Error fetching traffic flow:", error.message);
    res.status(500).json({ error: "Failed to fetch traffic flow" });
  }
};

export const calculateRoute: RequestHandler = async (req, res) => {
  try {
    const { startLat, startLon, endLat, endLon, routeType } = req.query;

    if (!startLat || !startLon || !endLat || !endLon) {
      return res
        .status(400)
        .json({ error: "Start and end coordinates are required" });
    }

    const response = await axios.get(
      `${TOMTOM_BASE_URL}/routing/1/calculateRoute/${startLat},${startLon}:${endLat},${endLon}/json`,
      {
        params: {
          key: TOMTOM_API_KEY,
          routeType: routeType || "fastest",
          traffic: true,
        },
      },
    );

    const route = response.data.routes[0];
    res.json({
      distance: route.summary.lengthInMeters,
      duration: route.summary.travelTimeInSeconds,
      summary: {
        lengthInMeters: route.summary.lengthInMeters,
        travelTimeInSeconds: route.summary.travelTimeInSeconds,
      },
      legs: route.legs,
    });
  } catch (error: any) {
    console.error("Error calculating route:", error.message);
    res.status(500).json({ error: "Failed to calculate route" });
  }
};
