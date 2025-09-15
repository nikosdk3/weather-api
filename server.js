const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const BASE_URL =
  "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline";

app.get("/weather/:city", async (req, res) => {
  const city = req.params.city;

  try {
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
