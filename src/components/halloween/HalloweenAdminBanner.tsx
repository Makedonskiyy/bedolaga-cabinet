import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { halloweenApi } from '@/api/halloween';
import { useHaptic } from '@/platform';
import { HalloweenAdminModal } from './HalloweenAdminModal';

export function HalloweenAdminBanner() {
  const haptic = useHaptic();
  const queryClient = useQueryClient();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['halloween-admin-stats'],
    queryFn: halloweenApi.getAdminStats,
    staleTime: 1000 * 15,
  });

  const toggleMutation = useMutation({
    mutationFn: (newEnabled: boolean) => halloweenApi.toggleEvent(newEnabled),
    onSuccess: (data) => {
      haptic.notification('success');
      queryClient.invalidateQueries({ queryKey: ['halloween-config'] });
      queryClient.invalidateQueries({ queryKey: ['halloween-admin-stats'] });
      refetch();
      setActionStatus(data.message);
      setTimeout(() => setActionStatus(null), 4000);
    },
    onError: () => {
      haptic.notification('error');
    },
  });

  const sendReportMutation = useMutation({
    mutationFn: () => halloweenApi.sendAdminReport(),
    onSuccess: (data) => {
      haptic.notification('success');
      setActionStatus(data.message || 'Отчёт отправлен в Telegram');
      setTimeout(() => setActionStatus(null), 4000);
    },
    onError: (err: unknown) => {
      const anyErr = err as { response?: { data?: { detail?: string } }; message?: string };
      haptic.notification('error');
      setActionStatus(`Ошибка: ${anyErr?.response?.data?.detail || anyErr.message}`);
      setTimeout(() => setActionStatus(null), 5000);
    },
  });

  const isEnabled = Boolean(stats?.is_enabled);

  return (
    <>
      <div className="relative mb-5 overflow-hidden rounded-[24px] border border-white/10 bg-neutral-900/60 p-4 sm:p-5 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Левая часть: иконка, статус и описание */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <img
                src="/halloween/pumpkin-coin-white.svg"
                alt="Хэллоуин"
                className="h-8 w-8 object-contain"
              />
            </div>

            <div className="text-left">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Хэллоуинский ивент</h3>
                {isEnabled ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Включен для всех
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Скрыт (только админы)
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-white/60">
                {isEnabled
                  ? 'Ивент активен для всех: пользователи видят полноэкранный баннер и тапалку.'
                  : 'Ивент скрыт от обычных пользователей, доступ разрешен только администраторам.'}
              </p>

              {/* Мини-показатели */}
              {stats && !isLoading && (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-2xs text-white/50">
                  <span>
                    Игроков: <b className="text-white">{stats.total_players}</b>
                  </span>
                  <span>•</span>
                  <span>
                    Натапано:{' '}
                    <b className="text-orange-400">
                      {stats.total_earned_minutes.toLocaleString()} мин
                    </b>
                  </span>
                  <span>•</span>
                  <span>
                    Игр: <b className="text-white">{stats.total_games}</b>
                  </span>
                  <span>•</span>
                  <span>
                    Выдано VPN: <b className="text-white">{stats.total_claimed_days} дн.</b>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Правая часть: кнопки действий */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={toggleMutation.isPending}
              onClick={() => toggleMutation.mutate(!isEnabled)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-50 ${
                isEnabled
                  ? 'border border-red-500/30 bg-red-500/15 text-red-400 hover:bg-red-500/25'
                  : 'bg-orange-500 text-orange-950 hover:bg-orange-400'
              }`}
            >
              {toggleMutation.isPending
                ? 'Сохранение...'
                : isEnabled
                  ? 'Выключить для всех'
                  : 'Включить для всех'}
            </button>

            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/10 active:scale-95"
            >
              Статистика
            </button>

            <Link
              to="/halloween"
              className="rounded-full border border-orange-500/30 bg-orange-500/15 px-3.5 py-2 text-xs font-semibold text-orange-400 transition hover:bg-orange-500/25 active:scale-95"
            >
              Открыть ивент
            </Link>

            <button
              onClick={() => {
                haptic.impact('light');
                window.dispatchEvent(new CustomEvent('open-halloween-banner'));
              }}
              className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white active:scale-95"
              title="Открыть начальный баннер на весь экран"
            >
              Баннер
            </button>

            <button
              disabled={sendReportMutation.isPending}
              onClick={() => sendReportMutation.mutate()}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/50 transition hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-50"
              title="Отправить ежедневный отчет в Telegram"
            >
              {sendReportMutation.isPending ? '...' : 'Отчёт в лог'}
            </button>
          </div>
        </div>

        {actionStatus && (
          <div className="mt-3 rounded-xl border border-orange-500/20 bg-orange-500/10 p-2 text-center text-xs font-medium text-orange-300">
            {actionStatus}
          </div>
        )}
      </div>

      <HalloweenAdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
    </>
  );
}
