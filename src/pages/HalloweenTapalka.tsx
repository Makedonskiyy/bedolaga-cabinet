import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useHaptic, usePlatform } from '@/platform';
import { useAuthStore } from '@/store/auth';
import { usePermissionStore } from '@/store/permissions';
import { halloweenApi, type HalloweenStateResponse } from '@/api/halloween';
import { HalloweenTrickOrTreatModal } from '@/components/halloween/HalloweenTrickOrTreatModal';
import { HalloweenClaimModal } from '@/components/halloween/HalloweenClaimModal';
import { HalloweenAdminModal } from '@/components/halloween/HalloweenAdminModal';
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
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const user = useAuthStore((state) => state.user);
  const roleLevel = usePermissionStore((state) => state.roleLevel);
  const effectiveIsAdmin = Boolean(
    isAdmin || (user as { is_admin?: boolean } | null)?.is_admin || roleLevel > 0,
  );

  // Конфиг видимости
  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ['halloween-config'],
    queryFn: halloweenApi.getConfig,
    staleTime: 1000 * 30,
  });

  const canAccess = Boolean(config?.is_enabled || effectiveIsAdmin);

  // Состояние с бэкенда
  const { data: serverState, refetch } = useQuery({
    queryKey: ['halloween-state'],
    queryFn: halloweenApi.getState,
    enabled: canAccess,
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
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
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
      const targetTime = new Date('2026-11-03T20:59:59Z').getTime();
      const diff = Math.max(0, targetTime - Date.now());

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const totalMinutes = hours * 60 + mins;

      setEventCountdown(`${days}д ${totalMinutes}мин`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 10000);
    return () => clearInterval(interval);
  }, []);

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

    const randomAngle = Math.floor(Math.random() * 40) - 20;
    const tapVal = state.profit_per_tap;

    const newTap: FloatingTap = {
      id: Date.now() + Math.random(),
      x: clientX - (rect?.left || 0),
      y: clientY - (rect?.top || 0),
      rotation: randomAngle,
      value: tapVal,
    };

    setFloatingTaps((prev) => [...prev.slice(-15), newTap]);

    setTimeout(() => {
      setFloatingTaps((prev) => prev.filter((item) => item.id !== newTap.id));
    }, 800);

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

  if (!isConfigLoading && !canAccess) {
    return (
      <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative mb-6">
          <img src="/halloween/pumpkin.png" alt="Halloween" className="h-32 w-32 object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-white">Ивент скоро начнется</h2>
        <p className="mt-3 text-sm leading-relaxed text-white/50">
          Хэллоуинская активность пока находится на стадии подготовки. Скоро откроется доступ к
          фарму минут и ценным наградам!
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-[92vh] max-w-lg flex-col items-center justify-between pb-24 pt-3 select-none">
      {/* Мягкий фоновый градиент сверху как в Figma */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-96 bg-gradient-to-b from-orange-500/20 via-orange-500/5 to-transparent" />

      {/* Панель администратора (жидкое стекло без свечения) */}
      {effectiveIsAdmin && (
        <div className="relative z-10 mb-3 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-neutral-900/70 px-4 py-2.5 backdrop-blur-xl">
          <div className="text-left">
            <div className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Админ-режим
            </div>
            <div className="text-xs text-white/60">
              {config?.is_enabled ? (
                <span className="text-emerald-400">Включен для всех</span>
              ) : (
                <span className="text-amber-400">Скрыт от пользователей</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 active:scale-95"
          >
            Управление
          </button>
        </div>
      )}

      {/* Оверлей при проклятии */}
      {state?.is_cursed && (
        <BrokenGlassOverlay
          onShare={handleShareAndUncurse}
          frozenMinutes={state.cursed_frozen_minutes}
          isLoading={isUncursing}
        />
      )}

      {/* Верхний блок: Выравнивание строго ПО ЦЕНТРУ */}
      <div className="relative z-10 w-full px-4 text-center flex flex-col items-center">
        <div className="text-2xl sm:text-3xl font-bold text-white">Заработано:</div>

        <div className="mt-2 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            <img
              src="/halloween/pumpkin-coin-white.svg"
              alt="Тыква"
              className="h-9 w-9 object-contain"
            />
          </div>
          <div className="text-3xl sm:text-4xl font-bold text-orange-500">
            {state ? state.available_minutes.toLocaleString() : '...'} минут
          </div>
        </div>

        <p className="mt-2 text-sm sm:text-base font-normal leading-relaxed text-white/50 max-w-md mx-auto">
          Хэллуинский инвент — мы запустили уникальное событие, с помщоью которго вы можете
          заработать минуты ВПН, выбить промоклды, скидки. Просто тапая тыкву
        </p>
      </div>

      {/* Сетка 4 карточек статистики: Жидкое стекло (liquid glass) */}
      <div className="relative z-10 mt-5 grid w-full grid-cols-2 gap-3 px-4">
        {/* Карточка 1: Закончится через (формат 16д 612мин без секунд) */}
        <div className="flex min-h-[96px] flex-col justify-between rounded-[20px] border border-orange-500/20 bg-orange-500/10 p-3.5 backdrop-blur-xl text-left">
          <span className="text-sm font-normal text-white/50">Закончится через:</span>
          <div className="font-bold text-lg sm:text-xl text-orange-500 leading-tight">
            {eventCountdown || '16д 612мин'}
          </div>
        </div>

        {/* Карточка 2: Ваш уровень (желтый контейнер, желтый призрак, желтый текст и кнопка улучшения) */}
        <div className="flex min-h-[96px] flex-col justify-between rounded-[20px] border border-amber-400/30 bg-amber-400/10 p-3.5 backdrop-blur-xl text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm font-normal text-amber-200/70">Ваш уровень</span>
            {state?.upgrade_cost !== null && state?.upgrade_cost !== undefined ? (
              <button
                onClick={handleUpgrade}
                disabled={
                  upgradeLoading || (state?.available_minutes || 0) < (state?.upgrade_cost || 0)
                }
                className="flex flex-col items-center justify-center rounded-2xl bg-amber-400 px-3 py-1 text-center transition hover:bg-amber-300 active:scale-95 disabled:opacity-40 cursor-pointer shadow-sm"
              >
                <span className="text-3xs font-extrabold uppercase tracking-tight text-stone-950">
                  Улучшить
                </span>
                <span className="text-2xs font-bold text-stone-900 leading-none">
                  за {state.upgrade_cost} минут
                </span>
              </button>
            ) : (
              <span className="text-2xs font-semibold text-amber-400/60">Макс. уровень</span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <img
              src="/halloween/ghost-yellow.svg"
              alt="Уровень"
              className="h-5 w-5 object-contain"
            />
            <span className="text-lg sm:text-xl font-bold text-amber-400">
              {state?.level_name || 'Первый'}
            </span>
          </div>
        </div>

        {/* Карточка 3: Прибыль за тап */}
        <div className="flex min-h-[96px] flex-col justify-between rounded-[20px] border border-white/10 bg-neutral-900/60 p-3.5 backdrop-blur-xl text-left">
          <span className="text-sm font-normal text-white/50">Прибыль за тап</span>
          <div className="mt-1 flex items-center gap-1.5 text-xl sm:text-2xl font-bold text-white">
            <span>+{state?.profit_per_tap || 1}</span>
            {state?.is_boosted && (
              <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400 border border-orange-500/30">
                x2
              </span>
            )}
          </div>
        </div>

        {/* Карточка 4: Доход в час */}
        <div className="flex min-h-[96px] flex-col justify-between rounded-[20px] border border-white/10 bg-neutral-900/60 p-3.5 backdrop-blur-xl text-left">
          <span className="text-sm font-normal text-white/50">Доход в час</span>
          <div className="mt-1 text-xl sm:text-2xl font-bold text-white">
            {state?.passive_per_hour || 15} минут
          </div>
        </div>
      </div>

      {/* Аккуратные кнопки действий: Сладость или гадость & Забрать VPN */}
      <div className="relative z-10 mt-4 flex w-full gap-2.5 px-4">
        <button
          onClick={() => setIsTotOpen(true)}
          className="flex flex-1 items-center justify-center rounded-full border border-white/10 bg-neutral-900/70 py-3.5 px-4 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-neutral-800/80 active:scale-95"
        >
          <span>Сладость или гадость</span>
          {state?.can_play_trick_or_treat && (
            <span className="ml-2 h-2 w-2 rounded-full bg-orange-500" />
          )}
        </button>

        <button
          onClick={() => setIsClaimOpen(true)}
          className="flex flex-1 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/15 py-3.5 px-4 text-sm font-bold text-orange-400 backdrop-blur-xl transition hover:bg-orange-500/25 active:scale-95"
        >
          <span>Забрать VPN ({state?.claimed_days || 0}/14 дн.)</span>
        </button>
      </div>

      {/* Центр: Большая тыква для тапалки (чистая без ядовитого свечения) */}
      <div className="relative my-auto flex items-center justify-center py-6">
        <div
          ref={pumpkinRef}
          onClick={handleTap}
          onTouchStart={handleTap}
          className="group relative flex h-64 w-64 cursor-pointer items-center justify-center transition-transform active:scale-95 select-none"
        >
          {/* Изображение тыквы строго по макету */}
          <img
            src="/halloween/pumpkin.png"
            alt="Тыква"
            className="h-60 w-60 object-contain select-none"
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
              className="pointer-events-none absolute z-20 font-bold text-4xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-out fade-out slide-out-to-top-12 duration-700"
            >
              +{tap.value}
            </span>
          ))}
        </div>
      </div>

      {/* Нижняя полоса энергии (чистое стекло) */}
      <div className="relative z-10 w-full px-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-white/50">
          <span>Энергия</span>
          <span className="font-semibold text-white/80">
            {state?.energy || 0} / {state?.max_energy || 1000}
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10 p-0.5 backdrop-blur-sm">
          <div
            style={{
              width: `${Math.min(100, Math.max(0, ((state?.energy || 0) / (state?.max_energy || 1000)) * 100))}%`,
            }}
            className="h-full rounded-full bg-orange-500 transition-all duration-300"
          />
        </div>
      </div>

      {/* Модальные окна */}
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

      {effectiveIsAdmin && (
        <HalloweenAdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
      )}
    </div>
  );
}
