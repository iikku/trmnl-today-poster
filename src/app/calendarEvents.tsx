"use server";

import { getEvents } from "./calendar";
import { log } from "console";

export default async function CalendarEvents() {
  log("Calendar events main");

  const events = await getEvents();

  return (
    <div>
        {events && events.map(calEvent =>
          <div key={calEvent.id || 'oopsie'}>
            {calEvent.start?.date}:
            <br />
            {calEvent.summary}
          </div>          
        )}
    </div>
  );
}
