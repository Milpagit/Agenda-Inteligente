// src/store/subjects/subjectSlice.js

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  subjects: [], // La lista de materias del usuario
  isLoading: true,
};

export const subjectSlice = createSlice({
  name: "subjects",
  initialState,
  reducers: {
    onLoadSubjects: (state, { payload }) => {
      state.subjects = payload;
      state.isLoading = false;
    },
    onAddSubject: (state, { payload }) => {
      state.subjects.push(payload);
    },
    onDeleteSubject: (state, { payload }) => {
      // payload será el ID de la materia a eliminar
      state.subjects = state.subjects.filter(
        (subject) => subject.id !== payload
      );
    },
  },
});

// Action creators are generated for each case reducer function
export const { onLoadSubjects, onAddSubject, onDeleteSubject } =
  subjectSlice.actions;
