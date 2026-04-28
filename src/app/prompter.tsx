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
    
  Sääennuste:
  - Sisältää tasan neljä osaa: Aamu, Päivä, Ilta, Yö
  - Jokaisessa:
    - sään symboli
    - lämpötila
    - sademäärä
  - Tiedot annetaan erikseen ja ne tulee esittää täsmälleen

  - Esitä nämä neljä osaa selkeästi erillisinä, mutta EI pakotetusti täydelliseen ruudukkoon
  - Ikonien tulee olla yksinkertaisia, paksuviivaisia ja tunnistettavia myös ditheröitynä
  - Vältä pieniä yksityiskohtia

  Näytä sääennusteen tiedot seuraavassa järjestyksessä:
  
  1. Aamu: sään symboli: ${weather.morning.symbol}, lämpötila: ${weather.morning.temperature} astetta, sademäärä: ${weather.morning.rain} mm
  2. Päivä: sään symboli: ${weather.day.symbol}, lämpötila: ${weather.day.temperature} astetta, sademäärä: ${weather.day.rain} mm
  3. Ilta: sään symboli: ${weather.evening.symbol}, lämpötila: ${weather.evening.temperature} astetta, sademäärä: ${weather.evening.rain} mm
  4. Yö: sään symboli: ${weather.night.symbol}, lämpötila: ${weather.night.temperature} astetta, sademäärä: ${weather.night.rain} mm

  Esitä sää selkeästi ikään kuin osana 50-luvun mainosta lämpötilojen ja symbolien kera.
  Tee symboleista elävän ja leikkisän näköisiä, ei vain tiukkaa infografiikkaa.
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
    - Kalenteritapahtumat (Vasemmalla):
    
    ${eventList}
    
    Tapahtumien asettelu voi olla pysty- tai vaakasuuntainen, riippuen visuaalisesta tasapainosta.
  `;
}
export const generatePrompt = async () => {
  log("generatePrompt");

  const eventList = await readableEvents();
  const currentWeather = await readableWeather();
  const specialDay = await todaysSpecialDayName();

  const prompt = `
  Luo vaakasuuntainen, posterimainen infograafinen näkymä 1950-luvun Mid-Century Modern -tyylissä.

  Tämä kuva tullaan muuntamaan 2-bittiseksi (4 sävyä) harmaasävykuvaksi ja ditheröimään, joten:
  - Kaikkien elementtien tulee toimia selkeinä myös ilman värejä
  - Käytä voimakasta vaalean ja tumman kontrastia (luminanssikontrasti)
  - Vältä hienovaraisia sävyeroja ja ohuita yksityiskohtia
  - Suosi selkeitä siluetteja ja suuria yhtenäisiä pintoja
  - Kaikkien tekstien tulee olla erittäin helposti luettavissa myös matalalla resoluutiolla

  Tyyli:
  - Mid-Century Modern, inspiroitunut 1950-luvun julisteista ja mainosgrafiikasta
  - Geometriset muodot, orgaaniset muodot ja atomic age -henkiset elementit
  - Kuvituksellinen ote: tämä EI ole moderni dashboard tai UI, vaan kuvitettu juliste

  Sommittelu:
  - Epäsymmetrinen mutta tasapainoinen asettelu (asymmetrical balance)
  - Elementit voivat osittain mennä päällekkäin (layering)
  - Käytä mittakaavakontrastia: yksi selkeä pääelementti (hero)
  - Jätä tarkoituksellista negatiivista tilaa
  - Vältä täydellistä ruudukkoa
    
  KALENTERITAPAHTUMAT (SYÖTE):
    Saat listan tapahtumia seuraavassa muodossa:

    "Tänään": "…",
    "<päivämäärä>": "…",
    "<päivämäärä>": "…"

    Tulkitse nämä näin:
    - Kaikki avain–arvo-parit ovat erillisiä tapahtumia
    - Avain = päivämäärä tai päivän nimi, kuten sana “Tänään”
    - Arvo = tapahtuman nimi

    TÄRKEÄ SÄÄNTÖ (HERO):
    - Jos ensimmäisen tapahtuman avain on “Tänään”, se on julisteen pääelementti (hero)
    - Jos ensimmäisen tapahtuman avain on jotain muuta kuin “Tänään”, selkeää pääelementtiä ei ole, vaan kaikki tapahtumat ovat samanarvoisia
    - Jos tänään on tapahtuma, esitä tämä tapahtuma visuaalisesti selvästi suurimpana elementtinä
    - Sen tulee hallita sommittelua enemmän kuin mikään muu sisältö
    - Voit käyttää tapahtuman teemaa visuaalisena motiivina (esim. objektit, symbolit, kuvitus)
    - Muut tapahtumat ovat selkeästi toissijaisia

    Teksti ja kieli:
    - Kaikki teksti suomeksi
    - Käytä selkeitä, paksuja sans-serif-tyylisiä kirjaimia
    - Vältä ohuita viivoja ja liian koristeellisia fontteja
    - Hyödynnä typografista kontrastia (koko, paino, asettelu)
    - Teksti voi mennä osittain kuvien päälle (overlay)
    
    - Otsikko (Yläreunassa):

    "${toTitle(new Date())}"

    ${eventPrompt(eventList)}
    ${specialDayPrompt(specialDay)}
    
    ${currentWeather}

    - Teema ja koristelu:
    Koita tunnistaa viikonpäivästä ${eventList ? ", kalenterin tapahtumista" : ""} ${specialDay ? ", juhlapäivästä" : ""} ja sääennusteesta jokin yhtenäinen teema tai useampi erillistä teemaa ja koristele näkymää kevyesti sen mukaisesti.

    Tavoite:
    Luo visuaalisesti kiinnostava, dynaaminen ja selkeä 1950-luvun juliste, joka säilyttää luettavuutensa ja visuaalisen iskevyyden myös 2-bittiseksi ditheröitynä harmaasävykuvana.
    `;
  log("Created the following prompt:\n", prompt);

  return prompt;
};
