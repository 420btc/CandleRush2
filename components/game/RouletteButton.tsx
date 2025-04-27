import React from 'react';

interface RouletteButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

// Minimal, circular, gold-outlined button with roulette icon (SVG)
const RouletteButton: React.FC<RouletteButtonProps> = ({ onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="ml-2 flex items-center justify-center rounded-full border-2 border-yellow-400 bg-black hover:bg-yellow-400/20 transition p-1 shadow focus:outline-none focus:ring-2 focus:ring-yellow-500"
    style={{ width: 32, height: 32, minWidth: 32, minHeight: 32 }}
    title="Girar Ruleta"
    aria-label="Girar Ruleta"
    tabIndex={0}
  >
    {/* Simple roulette wheel SVG icon */}
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#FFD600" strokeWidth="2" fill="#1a1a1a"/>
      <circle cx="12" cy="12" r="5" stroke="#FFD600" strokeWidth="1.5" fill="#FFD60033"/>
      {/* Segments */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        const x2 = 12 + 10 * Math.cos(angle);
        const y2 = 12 + 10 * Math.sin(angle);
        return (
          <line
            key={i}
            x1="12" y1="12" x2={x2} y2={y2}
            stroke="#FFD600" strokeWidth="1"
            opacity={0.7}
          />
        );
      })}
      {/* Marker */}
      <polygon points="12,2 14,6 10,6" fill="#FFD600" stroke="#B45309" strokeWidth="0.7" />
    </svg>
  </button>
);

export default RouletteButton;
