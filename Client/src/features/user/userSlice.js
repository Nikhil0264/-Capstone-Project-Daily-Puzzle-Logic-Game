import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  streak: 0,
  lastPlayed: null,
  totalPoints: 0,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateStreak: (state) => {
      state.streak += 1;
      state.lastPlayed = new Date().toISOString();
    },

    addPoints: (state, action) => {
      state.totalPoints += action.payload;
    },
  },
});

export const { updateStreak, addPoints } = userSlice.actions;

export default userSlice.reducer;
