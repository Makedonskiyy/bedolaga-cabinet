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
      setActionStatus(data.message || 'Отчёт успешно отправлен в Telegram!');
      setTimeout(() => setActionStatus(null), 4000);
    },
    onError: (err: any) => {
      haptic.notification('error');
      setActionStatus('Ошибка отправки: ' + (err?.response?.data?.detail || err.message));
      setTimeout(() => setActionStatus(null), 5000);
    },
  });

  const isEnabled = Boolean(stats?.is_enabled);

  return (
    <>
      <div className="relative mb-4 overflow-hidden rounded-3xl border border-orange-500/40 bg-zinc-950 p-4 sm:p-5 shadow-[0_0_40px_rgba(249,115,22,0.2)]">
        {/* Фоновое свечение */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-600/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Левая часть: лого, статус и название */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-500/40 bg-zinc-900 shadow-md">
              <img
                src="/halloween/pumpkin-coin.svg"
                alt="Halloween"
                className="h-10 w-10 drop-shadow-[0_4px_10px_rgba(249,115,22,0.5)] animate-pulse"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-orange-400">
                  🎃 Хэллоуинский ивент
                </h3>
                {isEnabled ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    ВКЛЮЧЕН ДЛЯ ВСЕХ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/30">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    ВЫКЛЮЧЕН (ТОЛЬКО АДМИНЫ)
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-zinc-300">
                {isEnabled
                  ? 'Ивент активен: пользователи видят баннер на весь экран, кнопку тыквы и тапалку.'
                  : 'Ивент в режиме тестирования: обычным пользователям скрыт, доступ открыт только администраторам.'}
              </p>

              {/* Мини-показатели */}
              {stats && !isLoading && (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-2xs text-zinc-400">
                  <span>
                    👥 Игроков: <b className="text-zinc-200">{stats.total_players}</b>
                  </span>
                  <span>•</span>
                  <span>
                    ⚡ Натапано:{' '}
                    <b className="text-orange-400">
                      {stats.total_earned_minutes.toLocaleString()} мин
                    </b>
                  </span>
                  <span>•</span>
                  <span>
                    🎰 Игр: <b className="text-amber-400">{stats.total_games}</b>
                  </span>
                  <span>•</span>
                  <span>
                    💎 Выдано VPN: <b className="text-purple-400">{stats.total_claimed_days} дн.</b>
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
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                isEnabled
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:brightness-110'
              }`}
            >
              {toggleMutation.isPending
                ? 'Сохранение...'
                : isEnabled
                  ? '🔒 Выключить для всех'
                  : '🚀 Включить для пользователей'}
            </button>

            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="rounded-xl border border-zinc-700 bg-zinc-900/90 px-3.5 py-2.5 text-xs font-bold text-zinc-200 hover:border-orange-500/40 hover:bg-zinc-850 active:scale-95"
            >
              📊 Статистика
            </button>

            <Link
              to="/halloween"
              className="rounded-xl border border-orange-500/50 bg-orange-500/10 px-3.5 py-2.5 text-xs font-bold text-orange-400 hover:bg-orange-500/20 active:scale-95"
            >
              🎃 Открыть тапалку
            </Link>

            <button
              onClick={() => {
                haptic.impact('light');
                window.dispatchEvent(new CustomEvent('open-halloween-banner'));
              }}
              className="rounded-xl border border-zinc-750 bg-zinc-900 px-3 py-2.5 text-xs font-semibold text-zinc-300 hover:border-orange-500/40 hover:text-white active:scale-95"
              title="Открыть всплывающий баннер на весь экран"
            >
              👁️ Баннер
            </button>

            <button
              disabled={sendReportMutation.isPending}
              onClick={() => sendReportMutation.mutate()}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white active:scale-95 disabled:opacity-50"
              title="Отправить ежедневный отчет в Telegram админ-чат"
            >
              {sendReportMutation.isPending ? '...' : '📨 Отчёт в лог'}
            </button>
          </div>
        </div>

        {actionStatus && (
          <div className="mt-3 rounded-xl bg-orange-500/10 border border-orange-500/30 p-2 text-center text-xs font-medium text-orange-300">
            {actionStatus}
          </div>
        )}
      </div>

      <HalloweenAdminModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
    </>
  );
}
