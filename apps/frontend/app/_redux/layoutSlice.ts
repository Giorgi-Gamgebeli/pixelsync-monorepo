"use client";

import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

const initialState = {
  pageHeading: "",
  icon: "",
};

const layoutSlice = createSlice({
  name: "layoutSlice",
  initialState,
  reducers: {
    changeHeading(state, action) {
      state.pageHeading = action.payload;
    },
    changeIcon(state, action) {
      state.icon = action.payload;
    },
  },
});

export const { changeIcon, changeHeading } = layoutSlice.actions;

export default layoutSlice.reducer;

export const getHeading = (state: RootState) => state.layout.pageHeading;

export const getIcon = (state: RootState) => state.layout.icon;
