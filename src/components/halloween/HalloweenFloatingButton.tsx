import { Link, useLocation } from 'react-router';
import { useHaptic } from '@/platform';

export function HalloweenFloatingButton() {
  const location = useLocation();
  const haptic = useHaptic();

  // Не показываем кнопку, если пользователь уже на странице ивента
  if (location.pathname === '/halloween') {
    return null;
  }

  return (
    <Link
      to="/halloween"
      onClick={() => haptic.impact('medium')}
      className="fixed z-40 flex items-center gap-2 rounded-full border border-orange-500/50 bg-zinc-950/90 px-3.5 py-2 shadow-[0_4px_25px_rgba(249,115,22,0.45)] backdrop-blur-md transition-all hover:scale-105 active:scale-95"
      style={{
        bottom: 'calc(var(--mobile-nav-offset, 16px) + 70px)',
        right: 'max(16px, env(safe-area-inset-right, 16px))',
      }}
    >
      <div className="relative flex h-8 w-8 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500/40 opacity-75" />
        <img
          src="/halloween/pumpkin-coin.svg"
          alt="Halloween Event"
          className="relative h-7 w-7 drop-shadow-md transition-transform group-hover:rotate-12"
        />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-2xs font-extrabold uppercase tracking-wider text-orange-400">
          Ивент 🎃
        </span>
        <span className="text-3xs font-medium text-zinc-400">Тапай тыкву</span>
      </div>
    </Link>
  );
}
