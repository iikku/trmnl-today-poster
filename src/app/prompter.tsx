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

type NormalizedEvent = {
  label: string;
  title: string;
  isToday: boolean;
};

const normalizeEvents = (events: any[]): NormalizedEvent[] => {
  return events
    .map(e => {
      const raw = e.start?.date || e.start?.dateTime || "";
      const label = toReadableDate(raw);

      return {
        label,
        title: e.summary,
        isToday: label === "Tänään"
      };
    })
    .filter(e => e.label && e.title);
};

const extractHero = (events: NormalizedEvent[]) => {
  return events.find(e => e.isToday) || null;
};

const buildEventDataBlock = (
  events: NormalizedEvent[],
  hero: NormalizedEvent | null
  ) => {
  const list = events
    .map(e => `- ${e.label}: ${e.title}`)
    .join("\n");

  if (hero) {
    return `
    KALENTERITAPAHTUMAT:

    PÄÄTAPAHTUMA:
    - ${hero.label}: ${hero.title}

    MUUT TAPAHTUMAT:
    ${events
      .filter(e => !e.isToday)
      .map(e => `- ${e.label}: ${e.title}`)
      .join("\n")}
    `;
  }

  return `
    KALENTERITAPAHTUMAT:

    TAPAHTUMAT:
    ${list}

    HUOM:
    - Yhtään tapahtumaa ei ole merkitty päätapahtumaksi
    - Kaikki tapahtumat ovat samanarvoisia
  `;
};

const eventPrompt = (eventBlock: string, hasHero: boolean) => {
  const heroInstructions = hasHero
    ? `
    PÄÄTAPAHTUMAN ESITYS:
    - Esitä päätapahtuma selkeästi suurimpana visuaalisena elementtinä
    - Sen tulee hallita sommittelua
    - Voit käyttää siihen liittyvää kuvitusta
    - Muut tapahtumat ovat selkeästi pienempiä
    `
        : `
    TAPAHTUMIEN ESITYS:
    - Älä korosta mitään tapahtumaa muita enemmän
    - Kaikki tapahtumat tulee esittää visuaalisesti samanarvoisina
  `;

  return `
    ${eventBlock}

    ${heroInstructions}

    - Sijoita tapahtumat julisteen vasemmalle puolelle
  `;
};

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

export const generatePrompt = async () => {
  log("Generating prompt");
  const rawEvents = await getEvents();

  const normalized = normalizeEvents(rawEvents);
  const hero = extractHero(normalized);

  const eventBlock = buildEventDataBlock(normalized, hero);
  const eventsSection = eventPrompt(eventBlock, !!hero);

  const weather = await readableWeather();
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
    - Epäsymmetrinen mutta tasapainoinen

    ${eventsSection}

    Teksti ja kieli:
    - Kaikki teksti suomeksi
    - Käytä selkeitä, paksuja sans-serif-tyylisiä kirjaimia
    - Vältä ohuita viivoja ja liian koristeellisia fontteja
    - Hyödynnä typografista kontrastia (koko, paino, asettelu)
    - Teksti voi mennä osittain kuvien päälle (overlay)
    
    Otsikko:
    "${toTitle(new Date())}"

    ${specialDayPrompt(specialDay)}

    ${weather}

    Teema ja koristelu:
    - Koita tunnistaa viikonpäivästä ${rawEvents ? ", kalenterin tapahtumista" : ""} ${specialDay ? ", juhlapäivästä" : ""} ja sääennusteesta jokin yhtenäinen teema tai useampi erillistä teemaa ja koristele näkymää sen mukaisesti.

    Tavoite:
    - Selkeä ja visuaalisesti kiinnostava 1950-luvun juliste, joka toimii 2-bittisenä.
  `;

  log("Created the following prompt:\n", prompt);

  return prompt;
};
