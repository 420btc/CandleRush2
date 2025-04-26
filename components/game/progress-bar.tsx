
interface ProgressBarProps {
  gamePhase: string;
  timeLeft: number; // ms
  phaseDuration: number; // ms
}

interface ProgressBarProps {
  gamePhase: string;
  timeLeft: number; // ms
  phaseDuration: number; // ms
}

export default function ProgressBar({ gamePhase, timeLeft, phaseDuration }: ProgressBarProps) {
  // El porcentaje depende SOLO de los props: countdown visual puro
  const percent = phaseDuration > 0 ? Math.max(0, Math.min(1, timeLeft / phaseDuration)) : 0;
  let color = "#00FF85";
  if (percent <= 0.2) {
    color = "#FF2222";
  } else if (percent <= 0.5) {
    color = "#FF9900";
  }
  return (
    <div className="w-[320px] sm:w-[400px] h-3 rounded-full bg-zinc-800 overflow-hidden mb-2 border border-[#FFD600]">
      <div
        className="h-full transition-all duration-500 ease-linear"
        style={{
          width: `${percent * 100}%`,
          background: color
        }}
      />
    </div>
  );
}

