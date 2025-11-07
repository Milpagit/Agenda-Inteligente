// src/store/habits/habitSlice.js

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  habits: [], // El estado inicial ahora está vacío para esperar la carga
};

export const habitSlice = createSlice({
  name: "habits",
  initialState,
  reducers: {
    // Reducer para cargar los hábitos desde Firebase
    onLoadHabits: (state, { payload }) => {
      state.habits = payload;
    },
    onAddHabit: (state, { payload }) => {
      state.habits.push(payload);
    },
    onToggleHabitDay: (state, { payload }) => {
      const { habitId, dayIndex } = payload;

      state.habits = state.habits.map((habit) => {
        if (habit.id === habitId) {
          const updatedCompletedDays = [...habit.completedDays];
          updatedCompletedDays[dayIndex] = !updatedCompletedDays[dayIndex];
          return { ...habit, completedDays: updatedCompletedDays };
        }
        return habit;
      });
    },
    onDeleteHabit: (state, { payload }) => {
      state.habits = state.habits.filter((habit) => habit.id !== payload);
    },
  },
});

// Action creators are generated for each case reducer function
export const { onLoadHabits, onAddHabit, onToggleHabitDay, onDeleteHabit } =
  habitSlice.actions;
