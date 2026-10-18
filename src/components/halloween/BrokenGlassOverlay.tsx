import { useEffect } from 'react';

interface BrokenGlassOverlayProps {
  onShare: () => void;
  frozenMinutes?: number;
  isLoading?: boolean;
}

export function BrokenGlassOverlay({
  onShare,
  frozenMinutes = 0,
  isLoading = false,
}: BrokenGlassOverlayProps) {
  useEffect(() => {
    if (window.navigator?.vibrate) {
      window.navigator.vibrate([100, 50, 200]);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-zinc-950 p-6 select-none animate-in fade-in duration-300">
      {/* Тонкие линии разбитого стекла и паутины (без ядовитого свечения) */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <path
          d="M500,500 L120,50 M500,500 L880,90 M500,500 L950,550 M500,500 L750,920 M500,500 L250,900 M500,500 L50,580 M500,500 L320,200 M500,500 L680,220 M500,500 L800,750 M500,500 L400,820"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M500,500 L180,120 L300,180 L500,500 L720,180 L820,120 L500,500 L880,480 L800,600 L500,500 L700,820 L580,880 L500,500 L280,850 L180,750 L500,500 L100,520 L180,400 Z"
          stroke="#ffffff"
          strokeWidth="1"
          strokeDasharray="4 6"
          fill="none"
        />
        {/* Паутина в углах */}
        <path
          d="M0,0 L180,0 M0,0 L160,70 M0,0 L120,120 M0,0 L70,160 M0,0 L0,180 M40,0 Q40,40 0,40 M80,0 Q80,80 0,80 M130,0 Q130,130 0,130 M180,0 Q180,180 0,180"
          stroke="#ffffff"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M1000,0 L820,0 M1000,0 L840,70 M1000,0 L880,120 M1000,0 L930,160 M1000,0 L1000,180 M960,0 Q960,40 1000,40 M920,0 Q920,80 1000,80 M870,0 Q870,130 1000,130 M820,0 Q820,180 1000,180"
          stroke="#ffffff"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />
      </svg>

      {/* Экран заколдования строго по Figma (screen trick.tsx) */}
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center text-center">
        <h2 className="mb-4 text-4xl sm:text-6xl font-bold text-white tracking-tight">
          Бу! Тебя заколдовали!
        </h2>

        <p className="mb-10 text-base sm:text-2xl font-medium leading-relaxed text-white/80 max-w-md">
          {frozenMinutes > 0
            ? `Привидение украло твои ${frozenMinutes} минут! Поделись ссылкой на ивент с другом, чтобы вернуть их и получить бонус x2`
            : 'Привидение украло твои минуты! Поделись ссылкой на ивент с другом, чтобы вернуть их и получить бонус x2'}
        </p>

        <button
          onClick={onShare}
          disabled={isLoading}
          className="w-full max-w-xs sm:max-w-sm rounded-full bg-orange-500 py-4 px-8 text-xl font-bold text-orange-950 transition-all hover:bg-orange-400 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'Возвращаем...' : 'Поделиться'}
        </button>
      </div>
    </div>
  );
}
