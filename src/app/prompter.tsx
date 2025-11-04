"use server";

import { getEvents } from "./calendar";
import { getCurrentWeather } from "./openmeteo";
import { todaysSpecialDayName } from "./specialDays";
import { log } from "console";
import { add, parseISO, format, formatDate } from "date-fns";
import { fi } from 'date-fns/locale';

const readableShortDateFormat = "cccc dd.MM."
const shortDateFormat = "dd.MM.yyyy"
const toReadableDate = (date: string) => {
  const asDate = parseISO(date);
  const formatted = formatDate(asDate, shortDateFormat);

  if (formatDate(new Date(), shortDateFormat) == formatted) {
    return "Tänään";
  }

  if (formatDate(add(new Date(), { days: 1 }), shortDateFormat) == formatted) {
    return "Huomenna";
  }

  if (formatDate(add(new Date(), { days: 2 }), shortDateFormat) == formatted) {
    return "Ylihuomenna";
  }

  return formatDate(asDate, readableShortDateFormat, { locale: fi });
}

const toTitle = (date: Date) => format(date, 'cccc d. MMMM', { locale: fi });

const readableEvents = async () => {
  const events = await getEvents();
  if (events.length == 0) {
    return null;
  }
  return events
    .map(e => "\"" + toReadableDate(e.start?.date || e.start?.dateTime || "") + "\": \"" + e.summary + "\"")
    .join(",\n");
}

const readableWeather = async () => {
  const weather = await getCurrentWeather();
  return `
  - Sääennuste (oikeassa osiossa):
    
  Sääennuste koostuu tasan neljästä ajankohdasta: aamu, päivä, ilta ja yö. Graafisesti ennuste koostuu tasan neljästä erillisestä ruudusta, joilla jokaisella on oma otsikkonsa: aamu, päivä, ilta tai yö.
  Jokaisessa ruudussa tulee näkyä symboli säätilalle, lämpötila Celsius-asteina ja sademäärä millimetreinä.
  Sijoita nämä tismalleen neljä sääruutua vierekkäin, allekkain tai selkeästi erotettuna 2x2-ruudukoksi, jotta kaikki näkyvät.
  Älä jätä yhtäkään ajankohtaa pois.

  Näytä sääennusteen tiedot seuraavassa järjestyksessä:
  
  1. Aamu: sään symboli: ${weather.morning.symbol}, lämpötila: ${weather.morning.temperature} astetta, sademäärä: ${weather.morning.rain} mm
  2. Päivä: sään symboli: ${weather.day.symbol}, lämpötila: ${weather.day.temperature} astetta, sademäärä: ${weather.day.rain} mm
  3. Ilta: sään symboli: ${weather.evening.symbol}, lämpötila: ${weather.evening.temperature} astetta, sademäärä: ${weather.evening.rain} mm
  4. Yö: sään symboli: ${weather.night.symbol}, lämpötila: ${weather.night.temperature} astetta, sademäärä: ${weather.night.rain} mm

  Esitä sää selkeästi ikään kuin osana 50-luvun mainosta - ehkä tyyliteltyinä ikoneina lämpötilojen ja symbolien kera.
  Sademäärän ja lämpötilan on oltava helposti luettavissa.
  `
}

const specialDayPrompt = (special: string | undefined) => {
  if (!special) return "";
  return "Tänään on " + special + ", joka on erityinen juhlapäivä. Lisää siihen liittyvä juhlatoivotus johonkin päin julistetta.";
}

const eventPrompt = (eventList: string | null) => {
  if (eventList == null) return "";
  return `
    - Kalenteritapahtumat (Vasemmassa kolmanneksessa):
    
    ${eventList}
    
    Tapahtumien asettelu voi olla pysty- tai vaakasuuntainen, riippuen visuaalisesta tasapainosta. Käytä erotteluun esimerkiksi tyyliteltyjä palloja, viivoja tai muita geometrisia elementtejä.
  `;
}
export const generatePrompt = async () => {
  log("generatePrompt");

  const eventList = await readableEvents();
  const currentWeather = await readableWeather();
  const specialDay = await todaysSpecialDayName();

  const prompt = `
    Luo vaakasuuntainen, posterimainen infograafinen näkymä, joka henkii 1950-luvun puolivälin modernia tyyliä (Mid-Century Modern).
    Inspiraationa voivat toimia aikakauden elokuva- ja matkailujulisteet, mainokset tai aikakauslehtien kannet.
    Korosta geometrisiä muotoja, rohkeaa, ajanmukaista typografiaa (esim. sans-serif-fontit) ja muita tyylin tunnusomaisia design-elementtejä, kuten orgaanisia muotoja, kirkkaita kontrasteja ja atomic age -henkistä kuvakieltä (esim. tyyliteltyjä atomeja, satelliitteja tai tähtikuvioita).
    
    Teksti ja asettelu:

    Kaikki teksti julisteessa tulee olla suomeksi.

    - Otsikko (Yläreunassa, keskitetty tai linjattu tyylikkäästi):

    "${toTitle(new Date())}" (Käytä rohkeaa, 50-luvun tyylistä otsikkofonttia).

    ${eventPrompt(eventList)}
    ${specialDayPrompt(specialDay)}
    
    ${currentWeather}

    - Teema ja koristelu:
    Koita tunnistaa viikonpäivästä ${eventList ? ", kalenterin tapahtumista" : ""} ${specialDay ? ", juhlapäivästä" : ""} ja sääennusteesta jokin yhtenäinen teema tai useampi erillistä teemaa ja koristele näkymää kevyesti sen mukaisesti.

    Tavoite: Luo visuaalisesti houkutteleva ja selkeä infograafi, joka yhdistää Mid-Century Modern -estetiikan nykypäivän tiedot saumattomasti.
  `;
  log("response", prompt);

  return prompt;
};
