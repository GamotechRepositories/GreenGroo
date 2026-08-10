import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as farmerApi from "../api/farmerApi";
import { FARMER_STORAGE_KEY, VERIFICATION_STATUS } from "../utils/constants";

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(FARMER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const stored = loadStoredAuth();

export const loginFarmer = createAsyncThunk("farmer/login", async (credentials) => {
  const data = await farmerApi.farmerLogin(credentials);
  localStorage.setItem(
    FARMER_STORAGE_KEY,
    JSON.stringify({ token: data.token, farmer: data.farmer })
  );
  return data;
});

export const fetchFarmerProfile = createAsyncThunk("farmer/fetchProfile", async () => {
  return farmerApi.getFarmerProfile();
});

export const fetchDocuments = createAsyncThunk("farmer/fetchDocuments", async () => {
  return farmerApi.getDocuments();
});

const farmerSlice = createSlice({
  name: "farmer",
  initialState: {
    token: stored?.token || null,
    farmer: stored?.farmer || null,
    documents: [],
    sidebarCollapsed: false,
    status: "idle",
    error: null,
  },
  reducers: {
    logoutFarmer(state) {
      state.token = null;
      state.farmer = null;
      state.documents = [];
      localStorage.removeItem(FARMER_STORAGE_KEY);
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action) {
      state.sidebarCollapsed = Boolean(action.payload);
    },
    setFarmerProfile(state, action) {
      state.farmer = { ...state.farmer, ...action.payload };
      const raw = localStorage.getItem(FARMER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        localStorage.setItem(
          FARMER_STORAGE_KEY,
          JSON.stringify({ ...parsed, farmer: state.farmer })
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginFarmer.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginFarmer.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.farmer = action.payload.farmer;
      })
      .addCase(loginFarmer.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchFarmerProfile.fulfilled, (state, action) => {
        state.farmer = action.payload;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.documents = action.payload;
        if (state.farmer) {
          const required = action.payload.filter((d) =>
            ["aadhaar", "pan", "bank", "address"].includes(d.type)
          );
          let verificationStatus = VERIFICATION_STATUS.PENDING;
          if (required.every((d) => d.status === VERIFICATION_STATUS.APPROVED)) {
            verificationStatus = VERIFICATION_STATUS.APPROVED;
          } else if (required.some((d) => d.status === VERIFICATION_STATUS.REJECTED)) {
            verificationStatus = VERIFICATION_STATUS.REJECTED;
          }
          state.farmer = { ...state.farmer, verificationStatus };
        }
      });
  },
});

export const { logoutFarmer, toggleSidebar, setSidebarCollapsed, setFarmerProfile } =
  farmerSlice.actions;

export const selectIsVerified = (state) =>
  state.farmer.farmer?.verificationStatus === VERIFICATION_STATUS.APPROVED ||
  state.farmer.farmer?.verificationRequired === false;

export default farmerSlice.reducer;
