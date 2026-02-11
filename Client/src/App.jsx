// import { Route, Routes } from "react-router-dom";
// // import { generateDailyLogic } from "./core/gameLogic";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import Game from "./pages/Game";
// import Profile from "./pages/Profile";


// function App() {
//   // const seed = generateDailyLogic();

//   return (
//     // <div className="bg-black text-white min-h-screen flex items-center justify-center">
//     //   Seed: {seed}
//     // </div>
//     //All the routes sre define here//
//     <Routes>
//       <Route path='/' element={<Login />} />
//       <Route path='/dashboard' element={<Dashboard />} />
//       <Route path='/game' element={<Game />} />
//       <Route path='/profile' element={<Profile />} />
//     </Routes>
//   );
// }

// export default App;


import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import {  loadPuzzle } from "./features/puzzle/puzzleSlice";
import PuzzleBoard from "./components/PuzzleBoard";

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
  console.log("Dispatching loadPuzzle...");
  dispatch(loadPuzzle("easy"));
}, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <h1 className="text-3xl font-bold mt-6">🧠 Logic Looper</h1>
      <PuzzleBoard />
    </div>
  );
}
