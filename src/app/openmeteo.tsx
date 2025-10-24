"use server";

import { log } from 'console';
import { fetchWeatherApi } from 'openmeteo';
import { openWeatherWMOToEmoji } from '@akaguny/open-meteo-wmo-to-emoji';

const params = {
  "latitude": process.env.WEATHER_LATITUDE,
  "longitude": process.env.WEATHER_LONGITUDE,
  "hourly": ["temperature_2m", "rain", "weather_code", "is_day"],
  "timezone": "GMT+2",
  "forecast_days": 1,
};
const url = "https://api.open-meteo.com/v1/forecast";
const responses = await fetchWeatherApi(url, params);

// Process first location. Add a for-loop for multiple locations or weather models
const response = responses[0];

// Attributes for timezone and location
const latitude = response.latitude();
const longitude = response.longitude();
const elevation = response.elevation();
const timezone = response.timezone();
const timezoneAbbreviation = response.timezoneAbbreviation();
const utcOffsetSeconds = response.utcOffsetSeconds();

const hourly = response.hourly()!;

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

const weatherAtHour = (hour: number) =>
({
  temperature: Math.round(weatherData.hourly.temperature_2m?.at(hour) || 0),
  rain: Math.round(weatherData.hourly.rain?.at(hour) || 0),
  symbol: openWeatherWMOToEmoji(weatherData.hourly.weatherCode?.at(hour), weatherData.hourly.isDay?.at(hour) == 1 || false).value
});


const current: WeatherForFullDay = {
  morning: weatherAtHour(8),
  day: weatherAtHour(13),
  evening: weatherAtHour(18),
  night: weatherAtHour(22)
}

log("Current weather", current)

export const getCurrentWeather = async () => {
  return current;
}

