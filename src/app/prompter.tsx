"use server";

import { getEvents } from "./calendar";
import { log } from "console";
import { add, parseISO, format, formatDate } from "date-fns";
import { fi } from 'date-fns/locale';

const shortDateFormat = "dd.MM.yyyy"
const toReadableDate = (date: string) => {
  log("date", date);
  const formatted = formatDate(parseISO(date), shortDateFormat);
  
  if (formatDate(new Date(), shortDateFormat) == formatted) {
    log("match");
    return "Tänään";
  }

  if (formatDate(add(new Date(), { days: 1 }), shortDateFormat) == formatted) {
    log("match");
    return "Huomenna";
  }

  if (formatDate(add(new Date(), { days: 2 }), shortDateFormat) == formatted) {
    log("match");
    return "Ylihuomenna";
  }

  return formatted;
}

const toTitle = (date: Date) => format(date, 'cccc, dd. MMMM', { locale: fi });

const listEvents = async () => {
  const events = await getEvents();
  return events.map(e => toReadableDate(e.start?.date || "") + ": " + e.summary);
}

export const generatePrompt = async () => {
  log("generatePrompt");

  const eventList = await listEvents();

  const prompt = `
    Tehtäväsi on generoida inforuutuun näkymä. Ruutu on vaaka-asennossa.

    Tee julisteesta mid century modern -tyylinen, kuten vaikkapa elokuvajuliste tai mainos. Korosta geometrisia muotoja, 1950-luvun ajanmukaista typografiaa ja muita tyylin design-elementtejä.
    Voit ottaa suuntaa myös atomic age -kuvakielestä.
    
    Laita ylös otsikoksi tämän päivän nimi ja päivämäärä. Tänään on ${toTitle(new Date())}
    
    Laita vasemmalle noin kolmanneksen levyiseen osioon tulevat tapahtumat. Tapahtumia ovat:

    ${eventList}

    Laita oikealle sääennuste osoitteeseen Petsamo, Tampere, Suomi.

    Koristele näkymää kevyesti teeman mukaisesti.
  `;
  log("response", prompt);

  return prompt;
};
