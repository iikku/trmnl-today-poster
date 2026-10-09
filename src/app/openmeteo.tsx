"use server";

import { log } from 'console';
import { fetchWeatherApi } from 'openmeteo';
import { openWeatherWMOToEmoji } from '@akaguny/open-meteo-wmo-to-emoji';

const params = {
  "latitude": process.env.WEATHER_LATITUDE,
  "longitude": process.env.WEATHER_LONGITUDE,
  "hourly": ["temperature_2m", "rain", "weather_code", "is_day"],
  "timezone": "GMT+2",
  "forecast_days": 2,
};
const url = "https://api.open-meteo.com/v1/forecast";

const fetchWeather = async () => {
  const responses = await fetchWeatherApi(url, params);
  // Process first location. Add a for-loop for multiple locations or weather models
  const response = responses[0];


  // Attributes for timezone and location
  const hourly = response.hourly()!;
  const utcOffsetSeconds = response.utcOffsetSeconds();

  // Note: The order of weather variables in the URL query and the indices below need to match!
  const weatherData = {
    hourly: {
      time: [...Array((Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval())].map(
        (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
      ),
      temperature_2m: hourly.variables(0)!.valuesArray(),
      rain: hourly.variables(1)!.valuesArray(),
      weatherCode: hourly.variables(2)!.valuesArray(),
      isDay: hourly.variables(3)!.valuesArray()
    },
  };

  // Define clear windows (assuming index 0 is midnight today):
  // Morning commute/prep: 06:00 - 10:00 (indices 6 to 10)
  // Day / Afternoon: 11:00 - 16:00 (indices 11 to 16)
  // Evening: 17:00 - 21:00 (indices 17 to 21)
  // Night / Late Night (e.g., tonight's late hours or looking ahead): 22:00 - 03:00 (indices 22 to 27)
  const buildBlock = (start: number, end: number, symbolHour: number) => ({
    temperature: getAvgTemp(weatherData.hourly.temperature_2m, start, end), // Now uses the block average
    rain: getRainSum(weatherData.hourly.rain, start, end),                  // Uses the block sum
    symbol: openWeatherWMOToEmoji(
      weatherData.hourly.weatherCode?.at(symbolHour),
      weatherData.hourly.isDay?.at(symbolHour) == 1 || false
    ).value
  });

  // Helper to sum rain over a specific range of hourly indices
  const getRainSum = (rain: Float32Array | null, startHour: number, endHour: number) => {
    if (!rain) return 0;
    let sum = 0;
    for (let i = startHour; i <= endHour; i++) {
      sum += rain.at(i) || 0;
    }
    return Math.round(sum * 10) / 10;
  };

  // Helper to get a representative temperature (e.g., peak or average during that block)
  const getAvgTemp = (temp: Float32Array | null, startHour: number, endHour: number) => {
    if (!temp) return 0;
    let sum = 0;
    let count = 0;
    for (let i = startHour; i <= endHour; i++) {
      sum += temp.at(i) || 0;
      count++;
    }
    return Math.round(sum / count);
  };

  const current: WeatherForFullDay = {
    morning: buildBlock(6, 11, 8),    // 6 hours total, uses 08:00 for icon
    day: buildBlock(12, 17, 14),      // 6 hours total, uses 14:00 (2 PM) for icon
    evening: buildBlock(18, 23, 20),  // 6 hours total, uses 20:00 (8 PM) for icon
    night: buildBlock(24, 29, 26)     // 6 hours total (next night), uses 02:00 for icon
  };
  log("Current weather", current)
  return current;
}

type Weather = {
  temperature: number,
  rain: number,
  symbol: string
}

type WeatherForFullDay = {
  morning: Weather,
  day: Weather,
  evening: Weather,
  night: Weather
}

export const getCurrentWeather = async () => {
  return fetchWeather();
}

