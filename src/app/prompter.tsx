"use server";

import { getEvents } from "./calendar";
import { getCurrentWeather } from "./openmeteo";
import { todaysSpecialDayName } from "./specialDays";
import { log } from "console";
import { add, parseISO, format, formatDate } from "date-fns";
import { fi } from 'date-fns/locale';

const shortDateFormat = "dd.MM.yyyy"
const toReadableDate = (date: string) => {
  const formatted = formatDate(parseISO(date), shortDateFormat);

  if (formatDate(new Date(), shortDateFormat) == formatted) {
    return "Tänään";
  }

  if (formatDate(add(new Date(), { days: 1 }), shortDateFormat) == formatted) {
    return "Huomenna";
  }

  if (formatDate(add(new Date(), { days: 2 }), shortDateFormat) == formatted) {
    return "Ylihuomenna";
  }

  return formatted;
}

const toTitle = (date: Date) => format(date, 'cccc, dd. MMMM', { locale: fi });

const readableEvents = async () => {
  const events = await getEvents();
  if (events.length == 0) {
    return null;
  }
  return "{" +
    events.map(e => "\"" + toReadableDate(e.start?.date || e.start?.dateTime || "") + "\": \"" + e.summary + "\"")
    + "}";
}

const readableWeather = async () => {
  const weather = await getCurrentWeather();
  return `{
    "aamu": "${weather.morning.temperature} astetta, sadetta ${weather.morning.rain} mm, sään symboli: ${weather.morning.symbol}",
    "päivä": "${weather.day.temperature} astetta, sadetta ${weather.day.rain} mm, sään symboli: ${weather.day.symbol}",
    "ilta": "${weather.evening.temperature} astetta, sadetta ${weather.evening.rain} mm, sään symboli: ${weather.evening.symbol}",
    "yö": "${weather.night.temperature} astetta, sadetta ${weather.night.rain} mm, sään symboli: ${weather.night.symbol}"
  }`
}

const specialDayPrompt = (special: string | undefined) => {
  if (!special) return "";
  return "Tänään on " + special + ", joka on erityinen juhlapäivä. Lisää siihen liittyvä juhlatoivotus johonkin päin julistetta.";
}

const eventPrompt = (eventList: string | null) => {
  if (eventList == null) return "";
  return `
    Laita vasemmalle noin kolmanneksen levyiseen osioon tulevat kalenteritapahtumat. Tapahtumia ovat:
    ${eventList}
  `;
}
export const generatePrompt = async () => {
  log("generatePrompt");

  const eventList = await readableEvents();
  const currentWeather = await readableWeather();
  const specialDay = await todaysSpecialDayName();

  const prompt = `
    Tehtäväsi on generoida inforuutuun julistemainen näkymä. Juliste on vaaka-asennossa.

    Tee julisteesta mid century modern -tyylinen, kuten vaikkapa elokuvajuliste, mainos tai aikakauslehden kansi.
    Korosta geometrisia muotoja, 1950-luvun ajanmukaista modernia typografiaa ja muita tyylin design-elementtejä.
    Voit ottaa suuntaa myös atomic age -kuvakielestä.

    Tee julisteesta kokonaisuudessaan suomenkielinen.
    
    Laita ylös otsikoksi tämän päivän nimi ja päivämäärä. Tänään on ${toTitle(new Date())}

    ${specialDayPrompt(specialDay)}
    ${eventPrompt(eventList)}
    
    Laita oikealle sääennuste seuraavilla tiedoilla:
    ${currentWeather}

    Koita tunnistaa viikonpäivästä ${eventList ? ", kalenterin tapahtumista" : ""} ${specialDay ? ", juhlapäivästä" : ""} ja sääennusteesta jokin teema ja koristele näkymää kevyesti teeman mukaisesti.
  `;
  log("response", prompt);

  return prompt;
};
