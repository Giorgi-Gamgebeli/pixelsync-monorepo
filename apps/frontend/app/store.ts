"use client";

import { configureStore } from "@reduxjs/toolkit";
import layoutReducer from "@/app/_redux/layoutSlice";

const store = configureStore({
  reducer: {
    layout: layoutReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export default store;
