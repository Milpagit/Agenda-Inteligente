// src/store/ui/uiSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isDateModalOpen: false,
  isSubjectsModalOpen: false, // ✅ Añade esta línea
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    onOpenDateModal: (state) => {
      state.isDateModalOpen = true;
    },
    onCloseDateModal: (state) => {
      state.isDateModalOpen = false;
    },
    // ✅ Añade estos dos nuevos reducers
    onOpenSubjectsModal: (state) => {
      state.isSubjectsModalOpen = true;
    },
    onCloseSubjectsModal: (state) => {
      state.isSubjectsModalOpen = false;
    },
  },
});

// ✅ Exporta las nuevas acciones
export const {
  onOpenDateModal,
  onCloseDateModal,
  onOpenSubjectsModal,
  onCloseSubjectsModal,
} = uiSlice.actions;
