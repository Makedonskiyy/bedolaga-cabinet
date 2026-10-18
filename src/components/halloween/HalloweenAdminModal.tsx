import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { halloweenApi } from '@/api/halloween';
import { useHaptic } from '@/platform';
import { XIcon } from '@/components/icons';

interface HalloweenAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HalloweenAdminModal({ isOpen, onClose }: HalloweenAdminModalProps) {
  const haptic = useHaptic();
  const queryClient = useQueryClient();
  const [reportStatus, setReportStatus] = useState<string | null>(null);

  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['halloween-admin-stats'],
    queryFn: halloweenApi.getAdminStats,
    enabled: isOpen,
    refetchInterval: isOpen ? 10000 : false,
  });

  const toggleMutation = useMutation({
    mutationFn: (newEnabled: boolean) => halloweenApi.toggleEvent(newEnabled),
    onSuccess: () => {
      haptic.notification('success');
      queryClient.invalidateQueries({ queryKey: ['halloween-config'] });
      queryClient.invalidateQueries({ queryKey: ['halloween-admin-stats'] });
      refetch();
    },
    onError: () => {
      haptic.notification('error');
    },
  });

  const sendReportMutation = useMutation({
    mutationFn: () => halloweenApi.sendAdminReport(),
    onSuccess: (data) => {
      haptic.notification('success');
      setReportStatus(data.message || 'Отчёт успешно отправлен в Telegram!');
      setTimeout(() => setReportStatus(null), 5000);
    },
    onError: (err: unknown) => {
      const anyErr = err as { response?: { data?: { detail?: string } }; message?: string };
      haptic.notification('error');
      setReportStatus(`Ошибка отправки: ${anyErr?.response?.data?.detail || anyErr.message}`);
      setTimeout(() => setReportStatus(null), 6000);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative my-6 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-neutral-950/95 p-6 backdrop-blur-2xl">
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          <XIcon className="h-5 w-5" />
        </button>

        {/* Заголовок */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-3xl">🎃</span>
          <div>
            <h2 className="text-xl font-black text-orange-400">Админ-панель: Хэллоуинский ивент</h2>
            <p className="text-xs text-zinc-400">
              Управление видимостью и сводная статистика в реальном времени
            </p>
          </div>
        </div>

        {/* Блок переключения видимости */}
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-200">Статус ивента:</span>
                {stats?.is_enabled ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ВКЛЮЧЕН ДЛЯ ВСЕХ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    СКРЫТ (ВИДЯТ ТОЛЬКО АДМИНЫ)
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                {stats?.is_enabled
                  ? 'Ивент активен: все пользователи видят баннер, плавающую кнопку и могут играть.'
                  : 'Ивент скрыт: обычные пользователи не видят его в меню и получают заглушку.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={toggleMutation.isPending}
                onClick={() => toggleMutation.mutate(!stats?.is_enabled)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                  stats?.is_enabled
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40'
                    : 'bg-emerald-500 text-black hover:bg-emerald-400 font-extrabold'
                }`}
              >
                {toggleMutation.isPending
                  ? 'Сохранение...'
                  : stats?.is_enabled
                    ? '🔒 Выключить для всех'
                    : '🚀 Включить для пользователей'}
              </button>

              <button
                disabled={sendReportMutation.isPending}
                onClick={() => sendReportMutation.mutate()}
                className="rounded-xl border border-orange-500/40 bg-orange-500/10 px-3.5 py-2 text-xs font-semibold text-orange-400 hover:bg-orange-500/20 active:scale-95 disabled:opacity-50"
                title="Отправить суточный отчёт в админ-логи прямо сейчас"
              >
                {sendReportMutation.isPending ? 'Отправка...' : '📨 Отчёт в лог'}
              </button>
            </div>
          </div>

          {reportStatus && (
            <div className="mt-3 rounded-xl bg-orange-500/10 border border-orange-500/30 p-2 text-center text-xs text-orange-300">
              {reportStatus}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-zinc-500">Загрузка статистики...</div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Карточки ключевых показателей */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                <span className="text-2xs font-semibold uppercase text-zinc-400">Игроки</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-white">{stats.total_players}</span>
                  <span className="text-2xs text-emerald-400">
                    +{stats.today_new_players} сегодня
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                <span className="text-2xs font-semibold uppercase text-zinc-400">
                  Натапано минут
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-orange-400">
                    {stats.total_earned_minutes.toLocaleString()}
                  </span>
                </div>
                <div className="text-3xs text-zinc-500">
                  доступно: {stats.total_available_minutes.toLocaleString()}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                <span className="text-2xs font-semibold uppercase text-zinc-400">
                  Сладость / Гадость
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-amber-400">{stats.total_games}</span>
                  <span className="text-2xs text-zinc-400">игр</span>
                </div>
                <div className="text-3xs text-zinc-500">
                  🍬 {stats.total_treats} ({stats.treat_percentage}%) | 🕸️ {stats.total_tricks}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                <span className="text-2xs font-semibold uppercase text-zinc-400">Выдано VPN</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-purple-400">
                    {stats.total_claimed_days}
                  </span>
                  <span className="text-2xs text-zinc-400">дней</span>
                </div>
                <div className="text-3xs text-zinc-500">
                  сегодня: +{stats.today_claims_days} дн.
                </div>
              </div>
            </div>

            {/* Статистика за сегодня */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                📅 За сегодня (по МСК)
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                <div>
                  <span className="text-zinc-500">Игр сыграно:</span>{' '}
                  <span className="font-bold text-zinc-200">{stats.today_games}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Сладостей:</span>{' '}
                  <span className="font-bold text-emerald-400">
                    {stats.today_treats} ({stats.today_treat_percentage}%)
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Гадостей:</span>{' '}
                  <span className="font-bold text-red-400">
                    {stats.today_tricks} ({stats.today_trick_percentage}%)
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Обменов на VPN:</span>{' '}
                  <span className="font-bold text-purple-400">
                    {stats.today_claims_days} дн. ({stats.today_claims_count} заявок)
                  </span>
                </div>
              </div>
            </div>

            {/* Награды (выпадение) */}
            {stats.rewards_breakdown && stats.rewards_breakdown.length > 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  🎁 Выпавшие награды за всё время
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {stats.rewards_breakdown.map((r) => (
                    <div
                      key={r.reward_type}
                      className="rounded-xl border border-zinc-800/80 bg-zinc-950 p-2.5 text-xs"
                    >
                      <div className="font-semibold text-zinc-300">
                        {r.reward_type === 'minutes' && '🍬 Бонусные минуты'}
                        {r.reward_type === 'boost' && '⚡ Буст x2 (1ч)'}
                        {r.reward_type === 'promo' && '🏷️ Промокоды 25%'}
                        {r.reward_type === 'curse' && '🕷️ Заморозка / скример'}
                        {r.reward_type === 'uncurse' && '🕊️ Снято шерингом'}
                        {!['minutes', 'boost', 'promo', 'curse', 'uncurse'].includes(
                          r.reward_type,
                        ) && r.reward_type}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between text-2xs text-zinc-500">
                        <span>Количество:</span>
                        <span className="font-bold text-white">{r.count}</span>
                      </div>
                      {r.total_value > 0 && (
                        <div className="flex items-baseline justify-between text-2xs text-zinc-500">
                          <span>Всего:</span>
                          <span className="font-bold text-orange-400">
                            {r.total_value.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Топ 10 игроков */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                🏆 Топ 10 тыквенных мастеров
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="pb-2 font-medium">#</th>
                      <th className="pb-2 font-medium">Игрок</th>
                      <th className="pb-2 font-medium">Уровень</th>
                      <th className="pb-2 font-medium">Натапано</th>
                      <th className="pb-2 font-medium">Выдано VPN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {stats.top_players.map((player, idx) => (
                      <tr key={player.user_id} className="text-zinc-300">
                        <td className="py-2 font-bold text-orange-400">{idx + 1}</td>
                        <td className="py-2 font-semibold text-white">{player.name}</td>
                        <td className="py-2 text-zinc-400">Ур. {player.level}</td>
                        <td className="py-2 font-bold text-orange-400">
                          {player.earned_minutes.toLocaleString()} мин
                        </td>
                        <td className="py-2 text-purple-400 font-semibold">
                          {player.claimed_days} дн.
                        </td>
                      </tr>
                    ))}
                    {stats.top_players.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-zinc-500">
                          Пока нет данных об игроках
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Лента последних игр */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                🕒 Последние игры «Сладость или гадость»
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {stats.recent_games.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-950 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{g.is_treat ? '🍬' : '🕷️'}</span>
                      <div>
                        <span className="font-semibold text-zinc-200">{g.user_name}</span>
                        {g.chosen_pumpkin > 0 && (
                          <span className="ml-1.5 text-3xs text-zinc-500">
                            (тыква #{g.chosen_pumpkin})
                          </span>
                        )}
                        <div className="text-3xs text-zinc-400">{g.reward_title}</div>
                      </div>
                    </div>
                    <div className="text-right text-3xs text-zinc-500">
                      {g.created_at ? new Date(g.created_at).toLocaleTimeString() : ''}
                    </div>
                  </div>
                ))}
                {stats.recent_games.length === 0 && (
                  <div className="py-4 text-center text-xs text-zinc-500">Игр пока не было</div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
