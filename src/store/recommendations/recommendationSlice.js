// src/store/recommendations/recommendationSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeRecommendation: null, // Ahora será un objeto { id, text } o null
  isLoading: true,
};

export const recommendationSlice = createSlice({
  name: "recommendations",
  initialState,
  reducers: {
    onLoadRecommendation: (state, { payload }) => {
      state.activeRecommendation = payload;
      state.isLoading = false;
    },
    onDismissRecommendation: (state) => {
      state.activeRecommendation = null;
    },
  },
});

export const { onLoadRecommendation, onDismissRecommendation } =
  recommendationSlice.actions;
