// src/helpers/convertEventsToDateEvents.js

import { parseISO } from "date-fns";

export const convertEventsToDateEvents = (events = []) => {
  return events.map((event) => {
    // Si la fecha es un objeto de Firestore (Timestamp), la convertimos a Date
    if (event.start && typeof event.start.toDate === "function") {
      event.start = event.start.toDate();
    }
    // Si por alguna razón viene como texto (string), la parseamos
    else if (typeof event.start === "string") {
      event.start = parseISO(event.start);
    }

    if (event.end && typeof event.end.toDate === "function") {
      event.end = event.end.toDate();
    } else if (typeof event.end === "string") {
      event.end = parseISO(event.end);
    }

    return event;
  });
};
