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
    // Звуковой или haptic эффект при скримере/проклятии
    if (window.navigator?.vibrate) {
      window.navigator.vibrate([100, 50, 200, 50, 400]);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-300">
      {/* Эффект разбитого стекла и паутины через SVG */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40 mix-blend-screen"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        {/* Трещины стекла */}
        <path
          d="M500,500 L120,50 M500,500 L880,90 M500,500 L950,550 M500,500 L750,920 M500,500 L250,900 M500,500 L50,580 M500,500 L320,200 M500,500 L680,220 M500,500 L800,750 M500,500 L400,820"
          stroke="#ff8800"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M500,500 L180,120 L300,180 L500,500 L720,180 L820,120 L500,500 L880,480 L800,600 L500,500 L700,820 L580,880 L500,500 L280,850 L180,750 L500,500 L100,520 L180,400 Z"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          fill="none"
        />
        {/* Паутина в углу */}
        <path
          d="M0,0 L200,0 M0,0 L180,80 M0,0 L140,140 M0,0 L80,180 M0,0 L0,200 M50,0 Q50,50 0,50 M100,0 Q100,100 0,100 M150,0 Q150,150 0,150 M200,0 Q200,200 0,200"
          stroke="#f97316"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M1000,0 L800,0 M1000,0 L820,80 M1000,0 L860,140 M1000,0 L920,180 M1000,0 L1000,200 M950,0 Q950,50 1000,50 M900,0 Q900,100 1000,100 M850,0 Q850,150 1000,150 M800,0 Q800,200 1000,200"
          stroke="#f97316"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
      </svg>

      {/* Анимированный призрак / паук */}
      <div className="absolute top-12 animate-bounce">
        <img
          src="/halloween/ghost.svg"
          alt="Ghost"
          className="h-24 w-24 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]"
        />
      </div>

      {/* Карточка контента со скримером */}
      <div className="relative z-10 mx-auto max-w-md rounded-3xl border-2 border-orange-500/60 bg-zinc-950/95 p-6 text-center shadow-[0_0_50px_rgba(249,115,22,0.4)] backdrop-blur-xl">
        <div className="mb-4 inline-block animate-pulse text-6xl">🕷️</div>

        <h2 className="mb-3 text-3xl font-extrabold text-orange-400 drop-shadow-md">
          Бу! Тебя заколдовали!
        </h2>

        <p className="mb-4 text-base font-medium leading-relaxed text-zinc-300">
          Привидение заморозило{' '}
          <span className="font-bold text-orange-400">
            {frozenMinutes > 0 ? `${frozenMinutes} минут` : 'твои минуты'}
          </span>
          ! Поделись ссылкой на ивент с другом в Telegram, чтобы снять проклятие и получить бонус{' '}
          <span className="font-bold text-emerald-400">x2</span> к возвращённым минутам!
        </p>

        <div className="mb-6 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-300">
          ✨ После нажатия «Поделиться» проклятие спадёт, а замороженные минуты умножатся на два!
        </div>

        <button
          onClick={onShare}
          disabled={isLoading}
          className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-4 text-lg font-bold text-zinc-950 shadow-lg shadow-orange-500/30 transition-transform active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'Снимаем проклятие...' : '🎃 Поделиться и вернуть x2'}
        </button>
      </div>
    </div>
  );
}
