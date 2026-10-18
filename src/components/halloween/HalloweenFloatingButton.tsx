import { Link, useLocation } from 'react-router';
import { useHaptic } from '@/platform';
import { PumpkinIcon } from '@/components/icons';

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
      onClick={() => haptic.impact('light')}
      className="fixed z-40 flex items-center gap-2.5 rounded-full border border-white/10 bg-neutral-900/80 px-4 py-2 shadow-xl backdrop-blur-xl transition hover:bg-neutral-800/90 active:scale-95 select-none"
      style={{
        bottom: 'calc(var(--mobile-nav-offset, 16px) + 70px)',
        right: 'max(16px, env(safe-area-inset-right, 16px))',
      }}
    >
      <PumpkinIcon className="h-6 w-6 shrink-0 text-orange-500" />
      <div className="flex flex-col text-left">
        <span className="text-xs font-bold text-white">Хэллоуин</span>
        <span className="text-2xs text-white/50">Тапай тыкву</span>
      </div>
    </Link>
  );
}
