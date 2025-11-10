import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  proactiveAlerts: [],
  isModalOpen: false,
};

export const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    onLoadAlerts: (state, { payload }) => {
      state.proactiveAlerts = payload;
      // Solo abrimos el modal si de verdad hay alertas
      state.isModalOpen = payload.length > 0;
    },
    onCloseAlertsModal: (state) => {
      state.isModalOpen = false;
      state.proactiveAlerts = []; // Limpiamos al cerrar
    },
  },
});

export const { onLoadAlerts, onCloseAlertsModal } = notificationSlice.actions;
