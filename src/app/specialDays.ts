"use server";
import { formatDate } from "date-fns";

/**
 * Human readable names for each special date
 */
const finnishFlagDays = new Map<string, string>([
    ["05.02.", "J.L. Runebergin päivä"],
    ["28.02.", "Kalevalan päivä"],
    ["19.03.", "Minna Canthin päivä eli tasa-arvon päivä"],
    ["09.04.", "Mikael Agricolan päivä eli suomen kielen päivä"],
    ["27.04.", "Kansallinen veteraanipäivä"],
    ["01.05.", "Vappu"],
    ["09.05.", "Eurooppa-päivä"],
    ["12.05.", "J.V. Snellmannin päivä eli suomalaisuuden päivä"],
    ["04.06.", "Puolustusvoiman lippujuhla"],
    ["06.07.", "Eino Leinon päivä eli runon ja suven päivä"],
    ["01.10.", "Miina Sillanpään ja kansalaisvaikuttamisen päivä"],
    ["10.10.", "Aleksis Kiven päivä eli suomalaisen kirjallisuuden päivä"],
    ["24.10.", "Yhdistyneiden Kansakuntien päivä"],
    ["06.11.", "svenska dagen, ruotsalaisuuden päivä"],
    ["20.11.", "Lapsen oikeuksien päivä"],
    ["06.12.", "itsenäisyyspäivä"],
    ["08.12.", "Jean Sibeliuksen päivä eli suomalaisen musiikin päivä"]]
)

// Function to find holiday by fixed date (dd.MM.)
function getFixedHolidayByDate(holidays: { "date": string, "localName": string }[], inputDate: string) {
    // Normalize input like "06.01." → "06.01"
    const cleanInput = inputDate.replace(/\.$/, "");

    // Extract day and month from holiday dates
    return holidays.find(h => {
        const [year, month, day] = h.date.split("-");
        return `${day}.${month}` === cleanInput;
    }) || null;
}

const getTodaysCommonHoliday = async (date: string) => {
    const year = formatDate(new Date(), 'yyyy');
    const holidays = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/FI`);
    const holidayJson = await holidays.json();
    return getFixedHolidayByDate(holidayJson, date)?.localName;
}

export const todaysSpecialDayName = async () => {
    const formattedDate = formatDate(new Date(), 'dd.MM.');

    const flagDay = finnishFlagDays.get(formattedDate);
    const common = await getTodaysCommonHoliday(formattedDate);

    return flagDay || common;
}