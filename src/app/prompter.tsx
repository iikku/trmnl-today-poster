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
  date: Date;
};

const normalizeEvents = (events: any[]): NormalizedEvent[] => {
  return events
    .map(e => {
      const raw = e.start?.date || e.start?.dateTime || "";
      const date = parseISO(raw);
      const label = toReadableDate(raw);

      return {
        label,
        title: e.summary,
        isToday: label === "Tänään",
        date
      };
    })
    .filter(e => e.label && e.title && e.date);
};

const getDayPriority = (label: string) => {
  if (label === "Tänään") return 0;
  if (label === "Huomenna") return 1;
  if (label === "Ylihuomenna") return 2;
  return 3;
};

const groupEventsByDay = (events: NormalizedEvent[]) => {
  const groups: Record<string, NormalizedEvent[]> = {};

  for (const e of events) {
    if (!groups[e.label]) {
      groups[e.label] = [];
    }
    groups[e.label].push(e);
  }

  // Muuta arrayksi + järjestä
  return Object.entries(groups)
    .map(([label, items]) => {
      // järjestä saman päivän sisällä kellon mukaan
      const sortedItems = items.sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        label,
        items: sortedItems,
        date: sortedItems[0].date
      };
    })
    .sort((a, b) => {
      const priorityDiff = getDayPriority(a.label) - getDayPriority(b.label);
      if (priorityDiff !== 0) return priorityDiff;

      // fallback: oikea päivämäärä
      return a.date.getTime() - b.date.getTime();
    });
};

const extractTodayEvents = (events: NormalizedEvent[]) => {
  return events.filter(e => e.isToday);
};

const buildEventDataBlock = (
  events: NormalizedEvent[],
  todayEvents: NormalizedEvent[]
) => {
  const groups = groupEventsByDay(events);

  const renderGroup = (label: string, items: NormalizedEvent[]) =>
    `${label}:\n${items.map(e => `  - ${e.title}`).join("\n")}`;

  if (todayEvents.length > 0) {
    const otherGroups = groups.filter(g => g.label !== "Tänään");

    return `
    PÄIVÄN TAPAHTUMAT:
    ${todayEvents.map(e => `- ${e.title}`).join("\n")}

    MUUT TAPAHTUMAT:
    ${otherGroups.map(g => renderGroup(g.label, g.items)).join("\n\n")}
    `;
  }

  return `
    ${groups.map(g => renderGroup(g.label, g.items)).join("\n\n")}

    HUOM:
    - Yhtään tapahtumaa ei ole tänään
    - Kaikki tapahtumat ovat tulevia
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

    MUIDEN TAPAHTUMIEN ESITYS:
    - Esitä muut tapahtumat pienempinä elementteinä
    - Tapahtumat on jo ryhmitelty päivän mukaan
    - Jokainen päivä on otsikko, jonka alla sen tapahtumat
    - Älä toista päivää jokaisen tapahtuman kohdalla
    - Merkitse tapahtumien ajankohta ja nimi selkeästi
    `
    : `
    TAPAHTUMIEN ESITYS
    - Merkitse tapahtumien ajankohta ja nimi selkeästi
    - Tapahtumat on jo ryhmitelty päivän mukaan
    - Jokainen päivä on otsikko, jonka alla sen tapahtumat
    - Älä toista päivää jokaisen tapahtuman kohdalla
    - Yhtään tapahtumaa ei saa esittää suurena otsikkona tai pääelementtinä
    - Yksikään tapahtuman nimi ei saa olla merkittävästi suurempi kuin muut

    VISUAALINEN HIERARKIA:
    - Julisteen suurin elementti EI ole tapahtuma
    - Suurin elementti voi olla esimerkiksi:
      - päivämäärä (otsikko), TAI
      - abstrakti kuvitus, TAI
      - sääkuvitus
    - Älä käytä suurta typografista pääotsikkoa tapahtumille
    - Anna tilaa koko sommitelman muille elementeille

    TUNNELMA:
    - Tapahtumat ovat tulevia → luo odottava, kevyt tunnelma
    - Esitä tapahtumat ikään kuin tulevina muistutuksina, ei pääviestinä
    - Vältä huomiota huutavaa typografiaa tapahtumien kohdalla
    - Älä otsikoi tapahtumia yhteisellä otsikolla "Tapahtumat" tai "Tulevat tapahtumat"
  `;

  return `
    KALENTERITAPAHTUMAT:

    Kullakin tapahtumalla antamassani listauksessa on päivän ihmisluettava nimi ja tapahtuman nimi. Esitä molemmat.
    Jos päivän nimi on huomenna tai ylihuomenna, älä esitä viikonpäivää tai päivämäärää vaan ihmisluettava nimi.
    Seuraavaksi listaan tapahtumat:

    ${eventBlock}

    ${heroInstructions}

    VISUAALINEN SOMMITTELU (TÄRKEÄ):

    - Älä esitä tapahtumia perinteisenä listana tai bullet point -rakenteena
    - Vältä selkeää “rivi rivin alla” -asettelua
    
    - Saman päivän tapahtumat muodostavat visuaalisen ryhmän, EI listaa
    - Ryhmä voi olla esimerkiksi:
      - kompakti tekstiblokki
      - kaareva tai epäsymmetrinen sommitelma
      - elementtien ympärille aseteltu teksti
      - pieni klusteri, jossa elementit eivät ole täysin suorassa linjassa
    
    - Päiväotsikko voi olla:
      - hieman sivussa
      - kevyesti kallistettu
      - tai visuaalisesti irrotettu tapahtumista
    
    - Tapahtumien nimet voivat:
      - olla hieman eri kohdissa (ei täydellisesti linjassa)
      - seurata muotoa tai kuvitusta
      - olla osittain päällekkäin kuvituksen kanssa
    
    - Käytä Mid-Century Modern -julisteille tyypillistä rytmiä:
      - epäsäännöllinen mutta tasapainoinen sijoittelu
      - eri kokoisia elementtejä
      - ei täydellistä gridiä

    - Tämä EI ole käyttöliittymä, aikataulu tai lista
    - Tämä on kuvitettu juliste, jossa informaatio on sommiteltu visuaalisesti

    TYPOGRAFINEN HIERARKIA:
    - Päiväotsikko on pienempi ja kevyempi kuin tapahtumien nimet
    - Tapahtuman nimi on suurempi ja visuaalisesti vahvempi
    - Päivä toimii vain ryhmittävänä elementtinä

    SIJAINTI KOKONAISUUDESSA:
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
  const todayEvents = extractTodayEvents(normalized);

  const eventBlock = buildEventDataBlock(normalized, todayEvents);
  const eventsSection = eventPrompt(eventBlock, todayEvents.length > 0);

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

    TYYLI:
    - Mid-Century Modern, inspiroitunut 1950-luvun julisteista ja mainosgrafiikasta
    - Geometriset muodot, orgaaniset muodot ja atomic age -henkiset elementit
    - Kuvituksellinen ote: tämä EI ole moderni dashboard tai UI, vaan kuvitettu juliste

    KOKONAISUUDEN SOMMITTELU:
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
