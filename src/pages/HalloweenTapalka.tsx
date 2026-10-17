import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useHaptic, usePlatform } from '@/platform';
import { halloweenApi, type HalloweenStateResponse } from '@/api/halloween';
import { HalloweenTrickOrTreatModal } from '@/components/halloween/HalloweenTrickOrTreatModal';
import { HalloweenClaimModal } from '@/components/halloween/HalloweenClaimModal';
import { BrokenGlassOverlay } from '@/components/halloween/BrokenGlassOverlay';

interface FloatingTap {
  id: number;
  x: number;
  y: number;
  rotation: number;
  value: number;
}

export default function HalloweenTapalka() {
  const haptic = useHaptic();
  const { openTelegramLink } = usePlatform();

  // Состояние с бэкенда
  const { data: serverState, refetch } = useQuery({
    queryKey: ['halloween-state'],
    queryFn: halloweenApi.getState,
    refetchInterval: 10000,
  });

  const [state, setState] = useState<HalloweenStateResponse | null>(null);

  useEffect(() => {
    if (serverState) {
      setState(serverState);
    }
  }, [serverState]);

  // Модальные окна
  const [isTotOpen, setIsTotOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isUncursing, setIsUncursing] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Локальные вылетающие цифры тапов
  const [floatingTaps, setFloatingTaps] = useState<FloatingTap[]>([]);
  const pumpkinRef = useRef<HTMLDivElement>(null);

  // Буфер тапов для батч-отправки на бэкенд
  const pendingTapsRef = useRef<number>(0);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Таймер окончания ивента
  const [eventCountdown, setEventCountdown] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      if (!state?.event_remaining_seconds && state?.event_remaining_seconds !== 0) return;
      const targetTime = new Date('2026-11-03T20:59:59Z').getTime();
      const diff = Math.max(0, targetTime - Date.now());

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setEventCountdown(`${days} дн. ${hours} ч. ${mins} мин. ${secs} сек.`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [state?.event_remaining_seconds]);

  // Локальная регенерация энергии каждую секунду
  useEffect(() => {
    const timer = setInterval(() => {
      setState((prev) => {
        if (!prev) return prev;
        if (prev.energy >= prev.max_energy) return prev;
        return { ...prev, energy: Math.min(prev.max_energy, prev.energy + 1) };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Отправка накопленных тапов на сервер
  const flushTaps = useCallback(async () => {
    const count = pendingTapsRef.current;
    if (count <= 0) return;
    pendingTapsRef.current = 0;

    try {
      const updated = await halloweenApi.tap(count);
      setState(updated);
    } catch {
      refetch();
    }
  }, [refetch]);

  // Обработка клика/тапа по тыкве
  const handleTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!state) return;
    if (state.is_cursed) return;
    if (state.energy <= 0) {
      haptic.notification('warning');
      return;
    }

    haptic.impact('light');

    // Определение координат для вылетающей цифры
    const rect = pumpkinRef.current?.getBoundingClientRect();
    let clientX = rect ? rect.left + rect.width / 2 : 0;
    let clientY = rect ? rect.top + rect.height / 2 : 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const randomAngle = Math.floor(Math.random() * 40) - 20; // от -20 до +20 градусов
    const tapVal = state.profit_per_tap;

    const newTap: FloatingTap = {
      id: Date.now() + Math.random(),
      x: clientX - (rect?.left || 0),
      y: clientY - (rect?.top || 0),
      rotation: randomAngle,
      value: tapVal,
    };

    setFloatingTaps((prev) => [...prev.slice(-15), newTap]);

    // Удаляем вылетевшую цифру через 1 сек
    setTimeout(() => {
      setFloatingTaps((prev) => prev.filter((item) => item.id !== newTap.id));
    }, 900);

    // Оптимистичное обновление
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        energy: Math.max(0, prev.energy - 1),
        earned_minutes: prev.earned_minutes + tapVal,
        available_minutes: prev.available_minutes + tapVal,
      };
    });

    // Буферизация для батч-отправки
    pendingTapsRef.current += 1;
    if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
    flushTimeoutRef.current = setTimeout(flushTaps, 400);
  };

  // Улучшение уровня
  const handleUpgrade = async () => {
    if (!state || state.upgrade_cost === null || upgradeLoading) return;
    if (state.available_minutes < state.upgrade_cost) {
      haptic.notification('error');
      return;
    }

    setUpgradeLoading(true);
    try {
      const updated = await halloweenApi.upgrade();
      setState(updated);
      haptic.notification('success');
    } catch {
      haptic.notification('error');
    } finally {
      setUpgradeLoading(false);
    }
  };

  // Снятие проклятия
  const handleShareAndUncurse = async () => {
    setIsUncursing(true);
    try {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
        'https://t.me/bot?startapp=halloween',
      )}&text=${encodeURIComponent(
        '🎃 Хэллоуин в Triton VPN! Заходи тапать тыкву и забирай до 14 дней бесплатного VPN!',
      )}`;

      openTelegramLink(shareUrl);

      const res = await halloweenApi.uncurse();
      setState(res.state);
      haptic.notification('success');
    } finally {
      setIsUncursing(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[90vh] max-w-lg flex-col items-center justify-between pb-24 pt-3 select-none">
      {/* Если пользователь заколдован — оверлей с разбитым экраном */}
      {state?.is_cursed && (
        <BrokenGlassOverlay
          onShare={handleShareAndUncurse}
          frozenMinutes={state.cursed_frozen_minutes}
          isLoading={isUncursing}
        />
      )}

      {/* Верхний блок: Баланс заработанных минут */}
      <div className="w-full text-center">
        <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
          Заработано:
        </span>
        <div className="mt-1 flex items-center justify-center gap-2">
          <img src="/halloween/pumpkin-coin.svg" alt="Pumpkin" className="h-9 w-9 drop-shadow-md" />
          <span className="text-4xl font-black text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            {state ? state.available_minutes.toLocaleString() : '...'}
          </span>
          <span className="text-xl font-bold text-orange-400">минут</span>
        </div>

        <p className="mx-auto mt-2 max-w-xs text-xs font-medium leading-relaxed text-zinc-400">
          Хэллоуинский ивент — тапай тыкву, прокачивай уровень и забирай до 14 дней VPN, скидки и
          промокоды!
        </p>
      </div>

      {/* Сетка 4 карточек статистики */}
      <div className="mt-4 grid w-full grid-cols-2 gap-2.5 px-2">
        {/* Карточка 1: Таймер */}
        <div className="flex flex-col justify-between rounded-2xl border border-orange-500/25 bg-orange-500/10 p-3 shadow-inner">
          <span className="text-2xs font-semibold text-zinc-400">Закончится через:</span>
          <div className="mt-1 font-mono text-xs font-bold text-orange-400">
            {eventCountdown || 'Вычисление...'}
          </div>
        </div>

        {/* Карточка 2: Уровень и улучшение */}
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold text-zinc-400">Ваш уровень</span>
            {state?.upgrade_cost !== null && state?.upgrade_cost !== undefined && (
              <button
                onClick={handleUpgrade}
                disabled={
                  upgradeLoading || (state?.available_minutes || 0) < (state?.upgrade_cost || 0)
                }
                className="rounded-lg bg-orange-500 px-2 py-0.5 text-2xs font-bold text-zinc-950 transition-transform active:scale-95 disabled:opacity-40"
              >
                {upgradeLoading ? '...' : `+1 за ${state.upgrade_cost}м`}
              </button>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <img src="/halloween/ghost.svg" alt="Level" className="h-4 w-4" />
            <span className="text-xs font-bold text-white">{state?.level_name || 'Первый'}</span>
          </div>
        </div>

        {/* Карточка 3: Прибыль за тап */}
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
          <span className="text-2xs font-semibold text-zinc-400">Прибыль за тап</span>
          <div className="mt-1 flex items-center gap-1 text-sm font-black text-white">
            <span>+{state?.profit_per_tap || 1}</span>
            {state?.is_boosted && (
              <span className="rounded bg-amber-500/20 px-1 text-2xs font-bold text-amber-400">
                x2
              </span>
            )}
          </div>
        </div>

        {/* Карточка 4: Доход в час */}
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
          <span className="text-2xs font-semibold text-zinc-400">Доход в час</span>
          <div className="mt-1 text-sm font-black text-white">
            {state?.passive_per_hour || 15} минут
          </div>
        </div>
      </div>

      {/* Быстрые действия: Сладость или гадость & Обмен */}
      <div className="mt-3 flex w-full gap-2 px-2">
        <button
          onClick={() => setIsTotOpen(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-500/20 to-amber-500/20 py-2.5 text-xs font-bold text-orange-300 transition-transform active:scale-95"
        >
          <span>🎃</span>
          <span>Сладость или гадость</span>
          {state?.can_play_trick_or_treat && (
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setIsClaimOpen(true)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 py-2.5 text-xs font-bold text-emerald-300 transition-transform active:scale-95"
        >
          <span>🎁</span>
          <span>Забрать VPN ({state?.claimed_days || 0}/14 дн.)</span>
        </button>
      </div>

      {/* Центр: Большая тыква для тапалки */}
      <div className="relative my-auto flex items-center justify-center py-4">
        <div
          ref={pumpkinRef}
          onClick={handleTap}
          onTouchStart={handleTap}
          className="group relative flex h-64 w-64 cursor-pointer items-center justify-center transition-transform active:scale-90"
        >
          {/* Свечение за тыквой */}
          <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-3xl transition-opacity group-active:opacity-80" />

          {/* Изображение тыквы */}
          <img
            src="/halloween/pumpkin.png"
            alt="Tap Pumpkin"
            className="relative z-10 h-56 w-56 object-contain drop-shadow-[0_15px_30px_rgba(249,115,22,0.35)] transition-transform select-none"
            draggable={false}
          />

          {/* Вылетающие цифры тапов */}
          {floatingTaps.map((tap) => (
            <span
              key={tap.id}
              style={{
                left: `${tap.x}px`,
                top: `${tap.y}px`,
                transform: `rotate(${tap.rotation}deg)`,
              }}
              className="pointer-events-none absolute z-20 font-black text-3xl text-orange-300 drop-shadow-[0_0_8px_rgba(249,115,22,0.9)] animate-out fade-out slide-out-to-top-12 duration-700"
            >
              +{tap.value}
            </span>
          ))}
        </div>
      </div>

      {/* Нижняя полоса энергии */}
      <div className="w-full px-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-400">
          <span className="flex items-center gap-1">⚡ Энергия</span>
          <span className="font-mono text-orange-400">
            {state?.energy || 0} / {state?.max_energy || 1000}
          </span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800/80 p-0.5">
          <div
            style={{
              width: `${Math.min(100, Math.max(0, ((state?.energy || 0) / (state?.max_energy || 1000)) * 100))}%`,
            }}
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 shadow-md transition-all duration-300"
          />
        </div>
      </div>

      {/* Модалки */}
      {state && (
        <>
          <HalloweenTrickOrTreatModal
            isOpen={isTotOpen}
            onClose={() => setIsTotOpen(false)}
            onStateUpdate={(st) => setState(st)}
          />
          <HalloweenClaimModal
            isOpen={isClaimOpen}
            onClose={() => setIsClaimOpen(false)}
            state={state}
            onStateUpdate={(st) => setState(st)}
          />
        </>
      )}
    </div>
  );
}
