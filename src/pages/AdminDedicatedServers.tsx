import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminBackButton } from '@/components/admin';
import { useNotify } from '@/platform';
import { getFlagEmoji } from '@/utils/subscriptionHelpers';
import { getApiErrorMessage } from '@/utils/api-error';
import { adminRemnawaveApi, type SquadWithLocalInfo } from '@/api/adminRemnawave';
import {
  dedicatedServersApi,
  type DedicatedServerOrder,
  type AssignDedicatedOrderRequest,
  type RejectDedicatedOrderRequest,
} from '@/api/dedicatedServers';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import {
  ServerIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  RefreshIcon,
  ShieldIcon,
  SparklesIcon,
  InfoIcon,
} from '@/components/icons';

type StatusFilter = 'all' | 'pending' | 'active' | 'rejected';

export default function AdminDedicatedServers() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const notify = useNotify();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');

  // Modals state
  const [assigningOrder, setAssigningOrder] = useState<DedicatedServerOrder | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<DedicatedServerOrder | null>(null);

  // Form states for Assign
  const [ipAddress, setIpAddress] = useState('');
  const [squadUuid, setSquadUuid] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Form states for Reject
  const [rejectReason, setRejectReason] = useState('');

  // Fetch orders
  const {
    data: orders = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-dedicated-servers', statusFilter],
    queryFn: () => dedicatedServersApi.getAdminOrders(statusFilter),
    staleTime: 15_000,
  });

  // Fetch RemnaWave squads for quick squad_uuid selection
  const { data: squadsData } = useQuery({
    queryKey: ['admin-remnawave-squads'],
    queryFn: adminRemnawaveApi.getSquads,
    staleTime: 60_000,
  });
  const squads: SquadWithLocalInfo[] = squadsData?.items || [];

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!assigningOrder) throw new Error('No order selected');
      const payload: AssignDedicatedOrderRequest = {
        ip_address: ipAddress.trim(),
        squad_uuid: squadUuid.trim(),
        admin_notes: adminNotes.trim() || undefined,
      };
      return dedicatedServersApi.assignOrder(assigningOrder.id, payload);
    },
    onSuccess: () => {
      notify.success(
        t('admin.dedicated.assignSuccess', 'Сервер успешно настроен! Клиент получил уведомление.'),
      );
      setAssigningOrder(null);
      setIpAddress('');
      setSquadUuid('');
      setAdminNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-dedicated-servers'] });
    },
    onError: (err) => {
      notify.error(getApiErrorMessage(err, t('admin.dedicated.assignError', 'Ошибка активации')));
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!rejectingOrder) throw new Error('No order selected');
      const payload: RejectDedicatedOrderRequest = {
        reason: rejectReason.trim(),
      };
      return dedicatedServersApi.rejectOrder(rejectingOrder.id, payload);
    },
    onSuccess: () => {
      notify.success(
        t(
          'admin.dedicated.rejectSuccess',
          'Заказ отклонён. Средства автоматически возвращены на баланс клиента.',
        ),
      );
      setRejectingOrder(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-dedicated-servers'] });
    },
    onError: (err) => {
      notify.error(getApiErrorMessage(err, t('admin.dedicated.rejectError', 'Ошибка отклонения')));
    },
  });

  const handleOpenAssign = (order: DedicatedServerOrder) => {
    setAssigningOrder(order);
    setIpAddress(order.ip_address || '');
    setSquadUuid(order.squad_uuid || '');
    setAdminNotes(order.admin_notes || '');
  };

  const handleOpenReject = (order: DedicatedServerOrder) => {
    setRejectingOrder(order);
    setRejectReason(
      t('admin.dedicated.defaultRejectReason', 'Нет свободных серверов в выбранной локации'),
    );
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-success-500/15 px-2.5 py-0.5 text-xs font-medium text-success-400">
          <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
          {t('dedicated.status.active', 'Активен')}
        </span>
      );
    }
    if (s === 'pending' || s === 'setting_up') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning-500/15 px-2.5 py-0.5 text-xs font-medium text-warning-400">
          <ClockIcon className="h-3 w-3 text-warning-400" />
          {t('admin.dedicated.status.pending', 'Ожидает настройки')}
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-error-500/15 px-2.5 py-0.5 text-xs font-medium text-error-400">
          <span className="h-1.5 w-1.5 rounded-full bg-error-400" />
          {t('dedicated.status.rejected', 'Отклонён')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-dark-700 px-2 py-0.5 text-xs text-dark-300">
        {status}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AdminBackButton to="/admin" />
          <div>
            <h1 className="text-xl font-bold text-dark-100 sm:text-2xl">
              {t('admin.dedicated.title', 'Личные серверы (Dedicated VPS)')}
            </h1>
            <p className="text-xs text-dark-400 sm:text-sm">
              {t(
                'admin.dedicated.subtitle',
                'Управление заказами: назначение IP, привязка сквада RemnaWave и отклонение',
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="flex items-center gap-2 rounded-xl border border-dark-700 bg-dark-800/80 px-3.5 py-2 text-xs font-medium text-dark-200 transition-colors hover:bg-dark-700 disabled:opacity-50"
        >
          <RefreshIcon className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Обновить')}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex overflow-x-auto rounded-xl border border-dark-700/60 bg-dark-900/60 p-1 text-xs">
        {(
          [
            { id: 'pending', label: t('admin.dedicated.filters.pending', 'Ожидают настройки') },
            { id: 'active', label: t('admin.dedicated.filters.active', 'Активные') },
            { id: 'rejected', label: t('admin.dedicated.filters.rejected', 'Отклонённые') },
            { id: 'all', label: t('admin.dedicated.filters.all', 'Все заказы') },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 font-medium transition-colors ${
              statusFilter === tab.id
                ? 'bg-accent-500 text-on-accent'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <SkeletonGroup className="space-y-3">
          <Skeleton variant="card" count={3} className="h-28" />
        </SkeletonGroup>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dark-700/60 bg-dark-800/40 p-12 text-center">
          <ServerIcon className="mx-auto mb-3 h-10 w-10 text-dark-500" />
          <h3 className="text-base font-semibold text-dark-200">
            {t('admin.dedicated.noOrders', 'Заказов не найдено')}
          </h3>
          <p className="mt-1 text-xs text-dark-400">
            {t(
              'admin.dedicated.noOrdersDesc',
              'В выбранной категории нет заказов на данный момент.',
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const flag = order.flag || getFlagEmoji(order.country_code);
            const isPending =
              order.status.toLowerCase() === 'pending' ||
              order.status.toLowerCase() === 'setting_up';

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-dark-700/60 bg-dark-800/50 p-4 transition-colors hover:border-dark-600 sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Left Column: ID, Client, Country, Deployment */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-accent-400">
                        #{order.id}
                      </span>
                      {getStatusBadge(order.status)}
                      <span className="text-xs text-dark-400">
                        {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-dark-200">
                      <span className="text-xl leading-none">{flag || '🌐'}</span>
                      <span className="font-semibold text-dark-100">
                        {order.country_name || order.country_code}
                      </span>
                      <span className="text-dark-500">•</span>
                      <span>
                        {order.period_days} {t('dedicated.days', 'дней')}
                      </span>
                      <span className="text-dark-500">•</span>
                      <span className="rounded bg-dark-700 px-2 py-0.5 text-xs text-dark-300">
                        {order.deployment_type === 'turnkey'
                          ? t('dedicated.deployment.turnkey.label', 'Под ключ')
                          : t('dedicated.deployment.byos.label', 'Свой VPS (BYOS)')}
                      </span>
                    </div>

                    {/* Client information */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-dark-400">
                      <span>Клиент:</span>
                      {order.user_id && <span className="font-mono">ID {order.user_id}</span>}
                      {order.username && <span className="text-accent-400">@{order.username}</span>}
                      {order.email && <span>{order.email}</span>}
                      {order.telegram_id && <span>TG: {order.telegram_id}</span>}
                    </div>

                    {/* Options badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {order.options?.ai_access && (
                        <span className="inline-flex items-center gap-1 rounded bg-accent-500/15 px-2 py-0.5 text-[11px] font-medium text-accent-400">
                          <SparklesIcon className="h-3 w-3" />
                          AI
                        </span>
                      )}
                      {order.options?.youtube_no_ads && (
                        <span className="inline-flex items-center gap-1 rounded bg-accent-500/15 px-2 py-0.5 text-[11px] font-medium text-accent-400">
                          <ShieldIcon className="h-3 w-3" />
                          No Ads
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Configuration details (IP, Squad, Notes) */}
                  <div className="rounded-xl border border-dark-700/50 bg-dark-900/40 p-3 text-xs sm:min-w-[240px]">
                    <div className="flex items-center justify-between text-dark-400">
                      <span>IP-адрес:</span>
                      <span className="font-mono font-medium text-dark-200">
                        {order.ip_address || '—'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-dark-400">
                      <span>Squad UUID:</span>
                      <span className="truncate font-mono text-[11px] text-dark-300 max-w-[140px]">
                        {order.squad_uuid || '—'}
                      </span>
                    </div>
                    {order.admin_notes && (
                      <div className="mt-1 text-dark-400 border-t border-dark-800 pt-1">
                        <span className="text-[11px] italic text-dark-300">
                          {order.admin_notes}
                        </span>
                      </div>
                    )}
                    {order.rejected_reason && (
                      <div className="mt-1 text-error-400 border-t border-dark-800 pt-1">
                        Причина: {order.rejected_reason}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  {isPending && (
                    <div className="flex items-center gap-2 self-end lg:self-center">
                      <button
                        type="button"
                        onClick={() => handleOpenReject(order)}
                        className="rounded-xl border border-error-500/30 bg-error-500/10 px-3.5 py-2 text-xs font-semibold text-error-400 transition-colors hover:bg-error-500/20"
                      >
                        {t('common.reject', 'Отклонить')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAssign(order)}
                        className="rounded-xl bg-accent-500 px-4 py-2 text-xs font-semibold text-on-accent transition-colors hover:bg-accent-600"
                      >
                        {t('admin.dedicated.configure', 'Настроить')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Modal */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-dark-100">
                  {t('admin.dedicated.assignTitle', 'Настройка и активация VPS')}
                </h3>
                <p className="text-xs text-dark-400">
                  Заказ #{assigningOrder.id} ({assigningOrder.country_code} •{' '}
                  {assigningOrder.deployment_type === 'turnkey' ? 'Под ключ' : 'BYOS'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningOrder(null)}
                className="text-dark-400 hover:text-dark-200"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!ipAddress.trim() || !squadUuid.trim()) {
                  notify.error('Пожалуйста, укажите IP-адрес и Squad UUID');
                  return;
                }
                assignMutation.mutate();
              }}
              className="space-y-4"
            >
              {/* IP Address */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-dark-200">
                  IP-адрес VPS <span className="text-error-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="195.201.55.99"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full rounded-xl border border-dark-700 bg-dark-900 px-3.5 py-2.5 font-mono text-sm text-dark-100 placeholder-dark-500 focus:border-accent-500 focus:outline-none"
                />
              </div>

              {/* RemnaWave Squad Selection */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-semibold text-dark-200">
                    RemnaWave Squad UUID <span className="text-error-400">*</span>
                  </label>
                  {squads.length > 0 && (
                    <span className="text-[11px] text-dark-400">
                      Доступно сквадов: {squads.length}
                    </span>
                  )}
                </div>

                {squads.length > 0 && (
                  <select
                    value={squadUuid}
                    onChange={(e) => setSquadUuid(e.target.value)}
                    className="mb-2 w-full rounded-xl border border-dark-700 bg-dark-900 px-3 py-2 text-xs text-dark-200 focus:border-accent-500 focus:outline-none"
                  >
                    <option value="">— Выберите из списка или введите вручную ниже —</option>
                    {squads.map((s) => (
                      <option key={s.uuid} value={s.uuid}>
                        {s.display_name || s.name} ({s.uuid})
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  required
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={squadUuid}
                  onChange={(e) => setSquadUuid(e.target.value)}
                  className="w-full rounded-xl border border-dark-700 bg-dark-900 px-3.5 py-2.5 font-mono text-xs text-dark-100 placeholder-dark-500 focus:border-accent-500 focus:outline-none"
                />
              </div>

              {/* Admin Notes */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-dark-200">
                  Заметки администратора (опционально)
                </label>
                <textarea
                  rows={2}
                  placeholder="Внутренний комментарий к серверу..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full rounded-xl border border-dark-700 bg-dark-900 px-3.5 py-2 text-xs text-dark-100 placeholder-dark-500 focus:border-accent-500 focus:outline-none"
                />
              </div>

              {/* Info Note */}
              <div className="rounded-xl border border-accent-500/20 bg-accent-500/10 p-3 text-xs text-accent-300">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 shrink-0 text-accent-400 mt-0.5" />
                  <span>
                    После подтверждения заказ станет <b>активным</b>, подписка синхронизируется в
                    RemnaWave, а клиент получит уведомление в Telegram с персональной ссылкой.
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  className="rounded-xl border border-dark-700 px-4 py-2.5 text-xs font-semibold text-dark-300 transition-colors hover:bg-dark-700"
                >
                  {t('common.cancel', 'Отмена')}
                </button>
                <button
                  type="submit"
                  disabled={assignMutation.isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-accent-500 px-5 py-2.5 text-xs font-semibold text-on-accent transition-colors hover:bg-accent-600 disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4" />
                  {assignMutation.isPending
                    ? t('admin.dedicated.assigning', 'Сохранение...')
                    : t('admin.dedicated.assignSubmit', 'Активировать сервер')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-dark-700 bg-dark-800 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark-100">
                {t('admin.dedicated.rejectTitle', 'Отклонение заказа')}
              </h3>
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="text-dark-400 hover:text-dark-200"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-xs text-dark-300">
              Укажите причину отклонения заказа #{rejectingOrder.id}. Пользователь увидит её в
              личном кабинете.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!rejectReason.trim()) {
                  notify.error('Укажите причину отклонения');
                  return;
                }
                rejectMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-dark-200">
                  Причина отклонения <span className="text-error-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Например: Нет свободных IP в выбранной стране..."
                  className="w-full rounded-xl border border-dark-700 bg-dark-900 px-3.5 py-2 text-xs text-dark-100 placeholder-dark-500 focus:border-error-500 focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-error-500/20 bg-error-500/10 p-3 text-xs text-error-400">
                Средства будут автоматически возвращены на баланс пользователя в полном объёме.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingOrder(null)}
                  className="rounded-xl border border-dark-700 px-4 py-2.5 text-xs font-semibold text-dark-300 transition-colors hover:bg-dark-700"
                >
                  {t('common.cancel', 'Отмена')}
                </button>
                <button
                  type="submit"
                  disabled={rejectMutation.isPending}
                  className="rounded-xl bg-error-500 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-error-600 disabled:opacity-50"
                >
                  {rejectMutation.isPending
                    ? t('admin.dedicated.rejecting', 'Отклонение...')
                    : t('admin.dedicated.rejectSubmit', 'Подтвердить отказ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
