import { configureStore } from "@reduxjs/toolkit";
import farmerReducer from "./farmerSlice";

export const farmerStore = configureStore({
  reducer: {
    farmer: farmerReducer,
  },
});
