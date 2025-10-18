"use server";

import { getEvents } from "./calendar";
import { getCurrentWeather } from "./openmeteo";
import { log } from "console";
import { add, parseISO, format, formatDate } from "date-fns";
import { fi } from 'date-fns/locale';

const shortDateFormat = "dd.MM.yyyy"
const toReadableDate = (date: string) => {
  log("date", date);
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
  return events.map(e => " " + toReadableDate(e.start?.date || "") + ": " + e.summary + "\n");
}

const readableWeather = async () => {
  const weather = await getCurrentWeather();
  return `
  "aamu": ${weather.morning.temperature} astetta, sadetta ${weather.morning.rain} mm,
  "päivä": ${weather.day.temperature} astetta, sadetta ${weather.day.rain} mm,
  "ilta": ${weather.evening.temperature} astetta, sadetta ${weather.evening.rain} mm,
  "yö": ${weather.night.temperature} astetta, sadetta ${weather.night.rain} mm`;
}

export const generatePrompt = async () => {
  log("generatePrompt");

  const eventList = await readableEvents();
  const currentWeather = await readableWeather();

  const prompt = `
    Tehtäväsi on generoida inforuutuun näkymä. Ruutu on vaaka-asennossa.

    Tee julisteesta mid century modern -tyylinen, kuten vaikkapa elokuvajuliste tai mainos. Korosta geometrisia muotoja, 1950-luvun ajanmukaista typografiaa ja muita tyylin design-elementtejä.
    Voit ottaa suuntaa myös atomic age -kuvakielestä.

    Tee julisteesta kokonaisuudessaan suomen kielinen.
    
    Laita ylös otsikoksi tämän päivän nimi ja päivämäärä. Tänään on ${toTitle(new Date())}

    Jos tänään on virallinen liputuspäivä Suomessa, lisää juhlapäivän nimi tai siihen liittyvä juhlatoivotus johonkin päin julistetta.
    
    Laita vasemmalle noin kolmanneksen levyiseen osioon tulevat kalenteritapahtumat. Tapahtumia ovat:

    ${eventList}

    Laita oikealle sääennuste seuraavilla tiedoilla:
    ${currentWeather}

    Koita tunnistaa kalenterin tapahtumista, mahdollisesta juhlapäivästä ja sääennusteesta jokin teema ja koristele näkymää kevyesti teeman mukaisesti.
  `;
  log("response", prompt);

  return prompt;
};
