import React from "react";
import { BrowserRouter, NavLink, Routes, Route } from "react-router-dom";
import dynamic from "next/dynamic";

// Dinámico import de páginas Next
const GamePage = dynamic(() => import("@/app/game/page"), { ssr: false });
const ProfilePage = dynamic(() => import("@/app/profile/page"), { ssr: false });

export default function App() {
  return (
    <BrowserRouter>
      <nav className="p-4 bg-gray-100 flex gap-4">
        <NavLink to="/game" className={({ isActive }) =>
          isActive ? "font-bold text-blue-600" : "text-gray-700"
        }>
          Game
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) =>
          isActive ? "font-bold text-blue-600" : "text-gray-700"
        }>
          Profile
        </NavLink>
      </nav>
      <main className="p-4">
        <Routes>
          <Route path="/game" element={<GamePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<p>Select a page above.</p>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
