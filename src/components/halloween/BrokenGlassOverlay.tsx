import { useEffect, useState } from 'react';

interface BrokenGlassOverlayProps {
  onShare: () => void;
  frozenMinutes?: number;
  isLoading?: boolean;
}

/** Один угол паутины: концентрические дуги + радиальные нити, тянется из угла экрана. */
function CobwebCorner({
  corner,
  delay = 0,
}: {
  corner: 'tl' | 'tr' | 'bl' | 'br';
  delay?: number;
}) {
  const flip = corner === 'tr' || corner === 'br' ? 'scale-x-[-1]' : '';
  const flipY = corner === 'bl' || corner === 'br' ? 'scale-y-[-1]' : '';
  const position =
    corner === 'tl'
      ? 'left-0 top-0'
      : corner === 'tr'
        ? 'right-0 top-0'
        : corner === 'bl'
          ? 'left-0 bottom-0'
          : 'right-0 bottom-0';

  // Внешний div отвечает за появление (opacity+scale keyframe), внутренний svg —
  // за отражение в нужный угол (статичный transform), чтобы два разных
  // transform-свойства не перезаписывали друг друга.
  return (
    <div
      className={`pointer-events-none absolute ${position} h-40 w-40 sm:h-56 sm:w-56 animate-web-crawl opacity-0`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <svg className={`h-full w-full ${flip} ${flipY}`} viewBox="0 0 200 200" fill="none">
        {/* радиальные нити */}
        <path
          d="M0,0 L200,0 M0,0 L170,70 M0,0 L130,130 M0,0 L70,170 M0,0 L0,200"
          stroke="#e4e4e7"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* концентрические дуги паутины */}
        <path d="M38,0 Q38,38 0,38" stroke="#e4e4e7" strokeWidth="1" fill="none" />
        <path d="M78,0 Q78,78 0,78" stroke="#e4e4e7" strokeWidth="1" fill="none" />
        <path d="M122,0 Q122,122 0,122" stroke="#e4e4e7" strokeWidth="1" fill="none" />
        <path d="M165,0 Q165,165 0,165" stroke="#e4e4e7" strokeWidth="1" fill="none" />
        {/* паучок на нити */}
        <circle cx="46" cy="46" r="3" fill="#18181b" stroke="#e4e4e7" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

export function BrokenGlassOverlay({
  onShare,
  frozenMinutes = 0,
  isLoading = false,
}: BrokenGlassOverlayProps) {
  const [showFlash, setShowFlash] = useState(true);

  useEffect(() => {
    if (window.navigator?.vibrate) {
      window.navigator.vibrate([60, 40, 120, 40, 200]);
    }
    const t = setTimeout(() => setShowFlash(false), 650);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950 select-none animate-jumpscare-shake">
      {/* Вспышка-скример в момент появления экрана */}
      {showFlash && (
        <div
          className="pointer-events-none absolute inset-0 z-30 animate-jumpscare-flash"
          style={{
            background:
              'radial-gradient(circle at 50% 42%, rgba(255,255,255,0.9) 0%, rgba(249,115,22,0.55) 35%, rgba(9,9,11,0.95) 100%)',
          }}
        />
      )}

      {/* Виньетка-затемнение по краям */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.75)_100%)]" />

      {/* Паутина во всех четырёх углах */}
      <CobwebCorner corner="tl" delay={150} />
      <CobwebCorner corner="tr" delay={280} />
      <CobwebCorner corner="bl" delay={400} />
      <CobwebCorner corner="br" delay={520} />

      {/* Трещины «разбитого экрана» */}
      <svg
        className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-30"
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
      </svg>

      <div className="relative z-20 flex h-full w-full items-center justify-center p-6">
        <div className="relative mx-auto flex w-full max-w-lg flex-col items-center text-center">
          {/* Призрак, вылетающий навстречу */}
          <div className="mb-4 h-16 w-16 animate-ghost-pop opacity-0 sm:h-20 sm:w-20 [animation-delay:150ms] [animation-fill-mode:forwards]">
            <img src="/halloween/ghost.svg" alt="" className="h-full w-full animate-float" />
          </div>

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
    </div>
  );
}
