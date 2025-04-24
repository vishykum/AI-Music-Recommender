import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  platformPreference: 'yt', // default to YouTube
  isAuthenticated: false,
  userInfo: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setPlatform: (state, action) => {
      state.platformPreference = action.payload;
    },
    login: (state, action) => {
      state.isAuthenticated = true;
      state.userInfo = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.userInfo = null;
    }
  }
});

export const { setPlatform, login, logout } = userSlice.actions;
export default userSlice.reducer;
