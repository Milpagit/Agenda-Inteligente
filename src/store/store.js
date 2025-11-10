// src/store/store.js

import { configureStore } from "@reduxjs/toolkit";
import { calendarSlice } from "./calendar/calendarSlice";
import { uiSlice } from "./ui/uiSlice";
import { authSlice } from "./auth/authSlice";
import { taskSlice } from "./tasks/taskSlice";
import { habitSlice } from "./habits/habitSlice";
import { recommendationSlice } from "./recommendations/recommendationSlice";
import { subjectSlice } from "./subjects/subjectSlice"; // Se importa el nuevo subjectSlice
import { notificationSlice } from "./notifications/notificationSlice"; // <-- AÑADIR

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
    calendar: calendarSlice.reducer,
    tasks: taskSlice.reducer,
    habits: habitSlice.reducer,
    recommendations: recommendationSlice.reducer,
    subjects: subjectSlice.reducer, // ✅ Esta es la línea que faltaba
    notifications: notificationSlice.reducer, // <-- AÑADIR
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
