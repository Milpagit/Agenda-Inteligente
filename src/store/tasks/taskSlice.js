// src/store/tasks/taskSlice.js

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tasks: [], // El estado inicial está vacío para esperar la carga desde Firebase
};

export const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    onLoadTasks: (state, { payload }) => {
      state.tasks = payload;
    },
    onAddTask: (state, { payload }) => {
      // Con Immer (incluido en Redux Toolkit), .push() es una operación segura y reactiva.
      state.tasks.push(payload);
    },
    onToggleTask: (state, { payload }) => {
      // payload aquí es el taskId
      const task = state.tasks.find((task) => task.id === payload);
      if (task) {
        task.completed = !task.completed;
      }
    },
    onDeleteTask: (state, { payload }) => {
      // payload aquí es el taskId
      state.tasks = state.tasks.filter((task) => task.id !== payload);
    },
  },
});

// Action creators are generated for each case reducer function
export const { onLoadTasks, onAddTask, onToggleTask, onDeleteTask } =
  taskSlice.actions;
