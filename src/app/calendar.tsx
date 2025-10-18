"use server";

import { google } from "googleapis";
import { add } from "date-fns";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

const calendarId = process.env.CALENDAR_ID;

const initGoogleCalendar = async () => {
  try {
    const credentials = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY      
    }
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: SCOPES,
    });

    const calendar = google.calendar({ version: "v3", auth });

    console.log("Google Calendar API initialized:");
    return calendar;
  } catch (error) {
    console.error("Error initializing Google Calendar API:", error);
  }
};

export const getEvents = async () => {
  console.log("getEvents");
  
  const calendar = await initGoogleCalendar();

  const today = new Date();
  const response = await calendar?.events.list({
    calendarId: calendarId,
    eventTypes: ["default"],
    timeMin: today.toISOString(),
    timeMax: add(today, { days: 7 }).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  })

  const events = response?.data?.items || [];
  console.log("events", events);

  return events;
};
