import { configureStore } from "@reduxjs/toolkit";
import puzzleReducer from "../features/puzzle/puzzleSlice";
import userReducer from "../features/user/userSlice";

export const store = configureStore({
    reducer:{
        puzzle:puzzleReducer,
        user:userReducer
    }
})