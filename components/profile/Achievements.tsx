import React from "react";
import { FaLock, FaTrophy, FaArrowUp, FaArrowDown, FaClock, FaRedo, FaUserFriends, FaCoins, FaMoon, FaSun } from "react-icons/fa";

// Lista de logros inventados
const achievements = [
  {
    id: "first_trade",
    name: "Primer Trade",
    description: "Realiza tu primera apuesta.",
    icon: <FaTrophy className="text-yellow-400" size={32} />,
  },
  {
    id: "ten_trades",
    name: "10 Trades",
    description: "Realiza 10 apuestas.",
    icon: <FaCoins className="text-yellow-400" size={32} />,
  },
  {
    id: "bull_master",
    name: "Bull Master",
    description: "5 apuestas ganadas seguidas al alza.",
    icon: <FaArrowUp className="text-purple-400" size={32} />,
  },
  {
    id: "bear_master",
    name: "Bear Master",
    description: "5 apuestas ganadas seguidas a la baja.",
    icon: <FaArrowDown className="text-blue-400" size={32} />,
  },
  {
    id: "lucky_strike",
    name: "Lucky Strike",
    description: "Gana una apuesta con el mínimo posible.",
    icon: <FaTrophy className="text-green-400" size={32} />,
  },
  {
    id: "high_roller",
    name: "High Roller",
    description: "Apuesta el máximo permitido una vez.",
    icon: <FaCoins className="text-orange-400" size={32} />,
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Realiza una apuesta antes de las 9:00 AM.",
    icon: <FaSun className="text-yellow-300" size={32} />,
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Realiza una apuesta después de las 12:00 AM.",
    icon: <FaMoon className="text-indigo-400" size={32} />,
  },
  {
    id: "comeback_king",
    name: "Comeback King",
    description: "Recupera tu saldo después de estar en negativo.",
    icon: <FaRedo className="text-pink-400" size={32} />,
  },
  {
    id: "socializer",
    name: "Socializer",
    description: "Inicia sesión 5 días diferentes.",
    icon: <FaUserFriends className="text-yellow-200" size={32} />,
  },
];

import { useAchievements } from "./useAchievements";

const Achievements: React.FC = () => {
  const { achievements: unlockedList } = useAchievements();

  return (
    <div className="w-full max-w-3xl mx-auto bg-black/70 border-2 border-yellow-400 rounded-2xl p-8 shadow-2xl mt-8 flex flex-col items-center">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
        <FaTrophy className="text-yellow-400" /> Logros
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
        {achievements.map((ach) => {
          const unlocked = unlockedList.find((a) => a.id === ach.id)?.unlocked;
          return (
            <div
              key={ach.id}
              className={`flex flex-col items-center p-4 rounded-xl border-2 ${unlocked ? "border-yellow-400 bg-black/60" : "border-zinc-700 bg-black/30 opacity-50"} shadow-lg transition-all`}
            >
              <div className="mb-2">
                {unlocked ? ach.icon : <FaLock className="text-zinc-500" size={32} />}
              </div>
              <span className="font-bold text-yellow-300 text-lg text-center mb-1">{ach.name}</span>
              <span className="text-zinc-300 text-xs text-center">{ach.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;
