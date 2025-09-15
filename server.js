const express = require("express");
const axios = require("axios");
const redis = require("redis");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const BASE_URL =
  "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline";

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await client.connect();
})();

app.get("/weather/:city", async (req, res) => {
  const city = req.params.city.toLowerCase();

  try {
    // Check Redis cache
    const cached = await client.get(city);
    if (cached) {
      console.log("Cache hit for: ", city);
      return res.json(JSON.parse(cached));
    }

    console.log("Cahce miss for: ", city);

    // Fetch from API
    const response = await axios.get(`${BASE_URL}/${city}`, {
      params: {
        key: process.env.VISUAL_CROSSING_API_KEY,
        unitGroup: "metric",
      },
    });

    const data = response.data;

    const weather = {
      city: data.address,
      temperature: `${data.currentConditions.temp} C`,
      condition: data.currentConditions.conditions,
      humidity: `${data.currentConditions.humidity} %`,
    };

    await client.set(city, JSON.stringify(weather), {
      expiration: { type: "EX", value: 43200 }, // 12 hour expiration
    });

    res.json(weather);
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      error: "Failed to fetch weather data.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Weather API running on http://localhost:${PORT}`);
});
