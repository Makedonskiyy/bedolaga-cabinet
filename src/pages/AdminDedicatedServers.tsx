import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminBackButton } from '@/components/admin';
import { useNotify } from '@/platform';
import { getFlagEmoji } from '@/utils/subscriptionHelpers';
import { getApiErrorMessage } from '@/utils/api-error';
import { copyToClipboard } from '@/utils/clipboard';
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
  TagIcon,
  CopyIcon,
  PlusIcon,
  TrashIcon,
  CpuIcon,
} from '@/components/icons';

type AdminMainTab = 'orders' | 'pricing';
type StatusFilter = 'all' | 'pending' | 'setting_up' | 'active' | 'rejected';

interface CountryPriceItem {
  code: string;
  priceRubles: number;
}

export default function AdminDedicatedServers() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const notify = useNotify();

  // Navigation tabs
  const [mainTab, setMainTab] = useState<AdminMainTab>('orders');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Modals state
  const [assigningOrder, setAssigningOrder] = useState<DedicatedServerOrder | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<DedicatedServerOrder | null>(null);

  // Form states for Assign
  const [ipAddress, setIpAddress] = useState('');
  const [squadUuid, setSquadUuid] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Form states for Reject
  const [rejectReason, setRejectReason] = useState('');

  // Pricing Form State
  const [basePriceRubles, setBasePriceRubles] = useState<number>(1290);
  const [discount30, setDiscount30] = useState<number>(0);
  const [discount90, setDiscount90] = useState<number>(10);
  const [discount180, setDiscount180] = useState<number>(15);
  const [discount365, setDiscount365] = useState<number>(22);
  const [countryPrices, setCountryPrices] = useState<CountryPriceItem[]>([]);
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryPrice, setNewCountryPrice] = useState<number>(1490);

  // Fetch orders
  const {
    data: orders = [],
    isLoading: isOrdersLoading,
    isRefetching: isOrdersRefetching,
    refetch: refetchOrders,
    isError: isOrdersError,
    error: ordersError,
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

  // Fetch pricing config
  const {
    data: pricingData,
    isLoading: isPricingLoading,
    refetch: refetchPricing,
  } = useQuery({
    queryKey: ['admin-dedicated-pricing'],
    queryFn: dedicatedServersApi.getPricingConfig,
    staleTime: 30_000,
  });

  // Sync pricing data to form state when loaded
  useEffect(() => {
    if (pricingData) {
      if (pricingData.base_monthly_price_rubles !== undefined) {
        setBasePriceRubles(pricingData.base_monthly_price_rubles);
      } else if (pricingData.base_monthly_price_kopeks !== undefined) {
        setBasePriceRubles(pricingData.base_monthly_price_kopeks / 100);
      }

      if (pricingData.period_discounts) {
        setDiscount30(pricingData.period_discounts['30'] ?? 0);
        setDiscount90(pricingData.period_discounts['90'] ?? 10);
        setDiscount180(pricingData.period_discounts['180'] ?? 15);
        setDiscount365(pricingData.period_discounts['365'] ?? 22);
      }

      if (pricingData.country_prices_kopeks !== undefined) {
        const items: CountryPriceItem[] = Object.entries(pricingData.country_prices_kopeks).map(
          ([code, kopeks]) => ({
            code,
            priceRubles: kopeks / 100,
          }),
        );
        setCountryPrices(items);
      }
    }
  }, [pricingData]);

  // Status -> setting_up mutation
  const settingUpMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return dedicatedServersApi.updateStatusSettingUp(orderId);
    },
    onSuccess: () => {
      notify.success(t('admin.dedicated.settingUpSuccess', 'Заказ переведён в статус настройки!'));
      queryClient.invalidateQueries({ queryKey: ['admin-dedicated-servers'] });
    },
    onError: (err) => {
      notify.error(
        getApiErrorMessage(err, t('admin.dedicated.statusError', 'Ошибка смены статуса')),
      );
    },
  });

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

  // Save Pricing Mutation
  const savePricingMutation = useMutation({
    mutationFn: async () => {
      const countryPricesKopeks: Record<string, number> = {};
      for (const item of countryPrices) {
        if (item.code.trim() && item.priceRubles > 0) {
          countryPricesKopeks[item.code.toUpperCase().trim()] = Math.round(item.priceRubles * 100);
        }
      }

      return dedicatedServersApi.updatePricingConfig({
        base_monthly_price_kopeks: Math.round(Number(basePriceRubles) * 100),
        period_discounts: {
          '30': Number(discount30) || 0,
          '90': Number(discount90) || 0,
          '180': Number(discount180) || 0,
          '365': Number(discount365) || 0,
        },
        country_prices_kopeks: countryPricesKopeks,
      });
    },
    onSuccess: () => {
      notify.success(
        t(
          'admin.dedicated.pricingSaved',
          'Цены успешно сохранены и сразу применены в каталоге для всех клиентов!',
        ),
      );
      queryClient.invalidateQueries({ queryKey: ['admin-dedicated-pricing'] });
      queryClient.invalidateQueries({ queryKey: ['dedicated-servers-config'] });
    },
    onError: (err) => {
      notify.error(
        getApiErrorMessage(err, t('admin.dedicated.pricingError', 'Ошибка сохранения цен')),
      );
    },
  });

  const handleOpenAssign = (order: DedicatedServerOrder) => {
    setAssigningOrder(order);
    const prefillIp = order.ip_address || order.options?.byos?.ip || '';
    setIpAddress(prefillIp);
    setSquadUuid(order.squad_uuid || '');
    setAdminNotes(order.admin_notes || '');
  };

  const handleOpenReject = (order: DedicatedServerOrder) => {
    setRejectingOrder(order);
    setRejectReason(
      t('admin.dedicated.defaultRejectReason', 'Нет свободных серверов в выбранной локации'),
    );
  };

  const handleAddCountryPrice = () => {
    const code = newCountryCode.toUpperCase().trim();
    if (!code) return;
    if (countryPrices.some((c) => c.code === code)) {
      notify.error(`Страна ${code} уже добавлена`);
      return;
    }
    setCountryPrices([...countryPrices, { code, priceRubles: Number(newCountryPrice) || 0 }]);
    setNewCountryCode('');
    setNewCountryPrice(1490);
  };

  const handleRemoveCountryPrice = (code: string) => {
    setCountryPrices(countryPrices.filter((c) => c.code !== code));
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-500/15 px-2.5 py-0.5 text-xs font-semibold text-success-400">
          <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
          {t('dedicated.status.active', 'Активен')}
        </span>
      );
    }
    if (s === 'setting_up') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/15 px-2.5 py-0.5 text-xs font-semibold text-accent-300">
          <ClockIcon className="h-3 w-3 animate-spin text-accent-400" />
          {t('dedicated.status.setting_up', 'В настройке')}
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-500/15 px-2.5 py-0.5 text-xs font-semibold text-warning-400">
          <ClockIcon className="h-3 w-3 text-warning-400" />
          {t('admin.dedicated.status.pending', 'Ожидает')}
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-error-500/15 px-2.5 py-0.5 text-xs font-semibold text-error-400">
          <span className="h-1.5 w-1.5 rounded-full bg-error-400" />
          {t('dedicated.status.rejected', 'Отклонён')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-dark-700 px-2.5 py-0.5 text-xs font-medium text-dark-300">
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
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              {t('admin.dedicated.title', 'Личные серверы (Dedicated VPS)')}
            </h1>
            <p className="text-xs text-zinc-400 sm:text-sm">
              {t(
                'admin.dedicated.subtitle',
                'Управление заказами, выдача IP и RemnaWave сквадов, редактирование цен и скидок',
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (mainTab === 'orders') refetchOrders();
            else refetchPricing();
          }}
          disabled={isOrdersLoading || isOrdersRefetching || isPricingLoading}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
        >
          <RefreshIcon className={`h-4 w-4 ${isOrdersRefetching ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Обновить')}
        </button>
      </div>

      {/* Main Mode Tabs: Orders vs Pricing */}
      <div className="mb-6 flex gap-2 border-b border-white/[0.08] pb-3">
        <button
          type="button"
          onClick={() => setMainTab('orders')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            mainTab === 'orders'
              ? 'bg-accent-500 text-black shadow-sm'
              : 'text-zinc-400 hover:bg-white/[0.05] hover:text-white'
          }`}
        >
          <ServerIcon className="h-4 w-4" />
          {t('admin.dedicated.tabOrders', 'Заказы серверов')}
        </button>

        <button
          type="button"
          onClick={() => setMainTab('pricing')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
            mainTab === 'pricing'
              ? 'bg-accent-500 text-black shadow-sm'
              : 'text-zinc-400 hover:bg-white/[0.05] hover:text-white'
          }`}
        >
          <TagIcon className="h-4 w-4" />
          {t('admin.dedicated.tabPricing', 'Настройки цен')}
        </button>
      </div>

      {/* TAB 1: ORDERS MANAGEMENT */}
      {mainTab === 'orders' && (
        <div className="space-y-6">
          {/* Status Filter Tabs */}
          <div className="flex overflow-x-auto rounded-xl border border-white/[0.08] bg-zinc-900/60 p-1 text-xs gap-1">
            {(
              [
                { id: 'all', label: t('admin.dedicated.filters.all', 'Все заказы') },
                { id: 'pending', label: t('admin.dedicated.filters.pending', 'Ожидают') },
                { id: 'setting_up', label: t('admin.dedicated.filters.setting_up', 'В настройке') },
                { id: 'active', label: t('admin.dedicated.filters.active', 'Активные') },
                { id: 'rejected', label: t('admin.dedicated.filters.rejected', 'Отклонённые') },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 font-medium transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-accent-500 text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders List / Table */}
          {isOrdersLoading ? (
            <SkeletonGroup className="space-y-3">
              <Skeleton variant="card" count={3} className="h-28" />
            </SkeletonGroup>
          ) : isOrdersError ? (
            <div className="rounded-2xl border border-error-500/30 bg-error-500/[0.05] p-8 text-center backdrop-blur-xl">
              <XIcon className="mx-auto mb-3 h-10 w-10 text-error-400" />
              <h3 className="text-base font-semibold text-white">
                {t('admin.dedicated.loadError', 'Ошибка загрузки заказов')}
              </h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto">
                {getApiErrorMessage(
                  ordersError,
                  'Не удалось получить список заказов. Проверьте права администратора или соединение с сервером.',
                )}
              </p>
              <button
                type="button"
                onClick={() => refetchOrders()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
              >
                <RefreshIcon className="h-3.5 w-3.5" />
                {t('common.retry', 'Повторить')}
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12 text-center backdrop-blur-xl">
              <ServerIcon className="mx-auto mb-3 h-10 w-10 text-zinc-500" />
              <h3 className="text-base font-semibold text-white">
                {t('admin.dedicated.noOrders', 'Заказов не найдено')}
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
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
                const isPending = order.status.toLowerCase() === 'pending';
                const isSettingUp = order.status.toLowerCase() === 'setting_up';
                const isActive = order.status.toLowerCase() === 'active';
                const price =
                  order.price_rubles ??
                  (order.price_kopeks !== undefined ? order.price_kopeks / 100 : 0);

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition-colors hover:border-white/20 sm:p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Left: ID, Status, Country, Duration, Client */}
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-accent-400">
                            #{order.id}
                          </span>
                          {getStatusBadge(order.status)}
                          <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs font-bold text-white">
                            {price ? `${price}\u00A0₽` : '—'}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
                          </span>
                        </div>

                        {/* Country & Period & Deployment */}
                        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-200">
                          <span className="text-xl leading-none">{flag || '🌐'}</span>
                          <span className="font-semibold text-white">
                            {order.country_name || order.country_code}
                          </span>
                          <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-zinc-300">
                            {order.country_code}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span>
                            {order.period_days} {t('dedicated.days', 'дней')} (
                            {Math.round(order.period_days / 30)} мес.)
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="rounded bg-white/[0.06] px-2 py-0.5 text-xs text-zinc-300">
                            {order.deployment_type === 'turnkey'
                              ? t('dedicated.deployment.turnkey.label', 'Под ключ')
                              : t('dedicated.deployment.byos.label', 'Свой VPS (BYOS)')}
                          </span>
                        </div>

                        {/* Client details */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                          <span>Клиент:</span>
                          {order.user_id && <span className="font-mono">ID {order.user_id}</span>}
                          {order.username && (
                            <span className="text-accent-400 font-medium">@{order.username}</span>
                          )}
                          {order.email && <span>{order.email}</span>}
                          {order.telegram_id && <span>TG: {order.telegram_id}</span>}
                        </div>

                        {/* Options badges */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {order.options?.ai_access && (
                            <span className="inline-flex items-center gap-1 rounded bg-accent-500/15 px-2 py-0.5 text-[11px] font-medium text-accent-400">
                              <SparklesIcon className="h-3 w-3" />
                              AI доступ
                            </span>
                          )}
                          {order.options?.youtube_no_ads && (
                            <span className="inline-flex items-center gap-1 rounded bg-accent-500/15 px-2 py-0.5 text-[11px] font-medium text-accent-400">
                              <ShieldIcon className="h-3 w-3" />
                              YouTube без рекламы
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Configuration details (IP, Squad, Notes, BYOS) */}
                      <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3 text-xs sm:min-w-[280px]">
                        <div className="flex items-center justify-between text-zinc-400">
                          <span>IP-адрес:</span>
                          <span className="font-mono font-semibold text-white">
                            {order.ip_address || '—'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-zinc-400">
                          <span>Squad UUID:</span>
                          <span className="truncate font-mono text-[11px] text-zinc-300 max-w-[150px]">
                            {order.squad_uuid || '—'}
                          </span>
                        </div>

                        {/* Client BYOS Credentials if available */}
                        {order.options?.byos && (
                          <div className="mt-1.5 rounded-lg border border-accent-500/20 bg-accent-500/[0.05] p-2 space-y-1">
                            <div className="flex items-center gap-1 font-semibold text-accent-400 text-[11px]">
                              <CpuIcon className="h-3 w-3" />
                              <span>Данные VPS от клиента:</span>
                            </div>
                            {order.options.byos.ip && (
                              <div className="flex items-center justify-between text-[11px] text-zinc-300">
                                <span className="text-zinc-400">IP клиента:</span>
                                <span className="font-mono text-white font-medium">
                                  {order.options.byos.ip}
                                </span>
                              </div>
                            )}
                            {order.options.byos.ssh_port && (
                              <div className="flex items-center justify-between text-[11px] text-zinc-300">
                                <span className="text-zinc-400">SSH порт:</span>
                                <span className="font-mono text-white">
                                  {order.options.byos.ssh_port}
                                </span>
                              </div>
                            )}
                            {order.options.byos.ssh_password && (
                              <div className="flex items-center justify-between text-[11px] text-zinc-300">
                                <span className="text-zinc-400">Root пароль:</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await copyToClipboard(order.options?.byos?.ssh_password || '');
                                    notify.success('Пароль root скопирован');
                                  }}
                                  className="inline-flex items-center gap-1 font-mono text-accent-400 hover:underline"
                                >
                                  <span>{order.options.byos.ssh_password}</span>
                                  <CopyIcon className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            {order.options.byos.notes && (
                              <div className="border-t border-accent-500/20 pt-1 text-[10px] text-zinc-400 italic">
                                Заметка: {order.options.byos.notes}
                              </div>
                            )}
                          </div>
                        )}

                        {order.subscription_url && (
                          <div className="mt-1 flex items-center justify-between text-zinc-400 border-t border-white/[0.06] pt-1">
                            <span>Подписка:</span>
                            <span className="truncate font-mono text-[11px] text-accent-400 max-w-[150px]">
                              {order.subscription_url}
                            </span>
                          </div>
                        )}
                        {order.admin_notes && (
                          <div className="mt-1 border-t border-white/[0.06] pt-1 text-zinc-400">
                            <span className="text-[11px] italic text-zinc-300">
                              {order.admin_notes}
                            </span>
                          </div>
                        )}
                        {order.rejected_reason && (
                          <div className="mt-1 border-t border-white/[0.06] pt-1 text-error-400">
                            Причина: {order.rejected_reason} (средства возвращены)
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                        {/* Pending -> "Взять в работу" */}
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => settingUpMutation.mutate(order.id)}
                            disabled={settingUpMutation.isPending}
                            className="rounded-xl border border-accent-500/40 bg-accent-500/10 px-3.5 py-2 text-xs font-semibold text-accent-300 transition-colors hover:bg-accent-500/20 disabled:opacity-50"
                          >
                            Взять в работу
                          </button>
                        )}

                        {/* Pending or Setting_up -> "Выдать / Настроить" */}
                        {(isPending || isSettingUp) && (
                          <button
                            type="button"
                            onClick={() => handleOpenAssign(order)}
                            className="rounded-xl bg-accent-500 px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-accent-400"
                          >
                            Активировать / Выдать
                          </button>
                        )}

                        {/* Pending or Setting_up -> "Отклонить" */}
                        {(isPending || isSettingUp) && (
                          <button
                            type="button"
                            onClick={() => handleOpenReject(order)}
                            className="rounded-xl border border-error-500/30 bg-error-500/10 px-3 py-2 text-xs font-semibold text-error-400 transition-colors hover:bg-error-500/20"
                          >
                            Отклонить
                          </button>
                        )}

                        {/* Active -> Quick view info */}
                        {isActive && order.subscription_url && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (order.subscription_url) {
                                try {
                                  await copyToClipboard(order.subscription_url);
                                  notify.success('Ссылка подписки скопирована!');
                                } catch {
                                  notify.error('Не удалось скопировать');
                                }
                              }
                            }}
                            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08]"
                          >
                            <CopyIcon className="h-3.5 w-3.5" />
                            Скопировать ссылку
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRICING CONFIGURATION */}
      {mainTab === 'pricing' && (
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-2xl shadow-xl sm:p-8">
          <div className="mb-6 border-b border-white/[0.08] pb-4">
            <h2 className="text-lg font-bold text-white sm:text-xl">
              {t('admin.dedicated.pricingTitle', 'Управление ценами на Dedicated VPS')}
            </h2>
            <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
              Настройте базовую помесячную стоимость и скидки за длительность аренды. Изменения
              сразу же применяются в каталоге для всех клиентов.
            </p>
          </div>

          {isPricingLoading ? (
            <Skeleton variant="card" className="h-64" />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                savePricingMutation.mutate();
              }}
              className="space-y-6"
            >
              {/* Base monthly price */}
              <div className="max-w-md">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Базовая цена за месяц (₽) <span className="text-accent-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={basePriceRubles}
                    onChange={(e) => setBasePriceRubles(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base font-bold text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
                  />
                  <span className="absolute right-4 top-3.5 text-sm font-semibold text-zinc-400">
                    ₽ / мес
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Равно {(basePriceRubles * 100).toLocaleString()} копеек.
                </p>
              </div>

              {/* Period discounts */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Скидки за период (%)
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {/* 30 days */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                    <span className="text-xs text-zinc-400">1 месяц (30 дней)</span>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discount30}
                        onChange={(e) => setDiscount30(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-sm font-bold text-white focus:border-accent-500 focus:outline-none"
                      />
                      <span className="text-xs text-zinc-400">%</span>
                    </div>
                  </div>

                  {/* 90 days */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                    <span className="text-xs text-zinc-400">3 месяца (90 дней)</span>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discount90}
                        onChange={(e) => setDiscount90(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-sm font-bold text-white focus:border-accent-500 focus:outline-none"
                      />
                      <span className="text-xs text-zinc-400">%</span>
                    </div>
                  </div>

                  {/* 180 days */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                    <span className="text-xs text-zinc-400">6 месяцев (180 дней)</span>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discount180}
                        onChange={(e) => setDiscount180(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-sm font-bold text-white focus:border-accent-500 focus:outline-none"
                      />
                      <span className="text-xs text-zinc-400">%</span>
                    </div>
                  </div>

                  {/* 365 days */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                    <span className="text-xs text-zinc-400">1 год (365 дней)</span>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discount365}
                        onChange={(e) => setDiscount365(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-sm font-bold text-white focus:border-accent-500 focus:outline-none"
                      />
                      <span className="text-xs text-zinc-400">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Country price overrides */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Индивидуальные цены по странам (опционально)
                </label>
                <p className="mb-3 text-xs text-zinc-400">
                  Если для определенной страны требуется особая цена (например, США или ОАЭ),
                  укажите её здесь.
                </p>

                <div className="space-y-2">
                  {countryPrices.map((item) => (
                    <div
                      key={item.code}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3"
                    >
                      <span className="text-base">{getFlagEmoji(item.code) || '🌐'}</span>
                      <span className="w-16 font-mono text-sm font-bold text-white">
                        {item.code}
                      </span>
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.priceRubles}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCountryPrices(
                              countryPrices.map((c) =>
                                c.code === item.code ? { ...c, priceRubles: val } : c,
                              ),
                            );
                          }}
                          className="w-32 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white focus:border-accent-500 focus:outline-none"
                        />
                        <span className="text-xs text-zinc-400">₽ / мес</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCountryPrice(item.code)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-error-500/10 hover:text-error-400 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {/* Add country override */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <input
                      type="text"
                      maxLength={3}
                      placeholder="Код (US, DE)"
                      value={newCountryCode}
                      onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                      className="w-28 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Цена в ₽"
                      value={newCountryPrice}
                      onChange={(e) => setNewCountryPrice(Number(e.target.value))}
                      className="w-32 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-accent-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCountryPrice}
                      className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium text-white hover:bg-white/[0.1] transition-colors"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      Добавить страну
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-white/[0.08]">
                <button
                  type="submit"
                  disabled={savePricingMutation.isPending}
                  className="flex items-center gap-2 rounded-2xl bg-accent-500 px-6 py-3.5 text-sm font-semibold text-black transition-transform active:scale-[0.99] hover:bg-accent-400 disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4 stroke-[3]" />
                  {savePricingMutation.isPending ? 'Сохранение цен...' : 'Сохранить цены'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Assign Modal */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {t('admin.dedicated.assignTitle', 'Выдача и активация VPS')}
                </h3>
                <p className="text-xs text-zinc-400">
                  Заказ #{assigningOrder.id} ({assigningOrder.country_code} •{' '}
                  {assigningOrder.deployment_type === 'turnkey' ? 'Под ключ' : 'BYOS'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningOrder(null)}
                className="text-zinc-400 hover:text-white"
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
              {/* BYOS Client Credentials Hint if present */}
              {assigningOrder.options?.byos && (
                <div className="rounded-2xl border border-accent-500/30 bg-accent-500/[0.08] p-3.5 text-xs space-y-1.5">
                  <div className="font-semibold text-accent-400 flex items-center gap-1.5">
                    <CpuIcon className="h-4 w-4" />
                    Реквизиты VPS от клиента (BYOS):
                  </div>
                  {assigningOrder.options.byos.ip && (
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-400">IP клиента:</span>
                      <span className="font-mono text-white font-medium">
                        {assigningOrder.options.byos.ip}
                      </span>
                    </div>
                  )}
                  {assigningOrder.options.byos.ssh_port && (
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-400">SSH порт:</span>
                      <span className="font-mono text-white">
                        {assigningOrder.options.byos.ssh_port}
                      </span>
                    </div>
                  )}
                  {assigningOrder.options.byos.ssh_password && (
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-400">Пароль root:</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await copyToClipboard(assigningOrder.options?.byos?.ssh_password || '');
                          notify.success('Пароль root скопирован');
                        }}
                        className="inline-flex items-center gap-1 font-mono text-accent-400 hover:underline"
                      >
                        <span>{assigningOrder.options.byos.ssh_password}</span>
                        <CopyIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {assigningOrder.options.byos.notes && (
                    <div className="border-t border-accent-500/20 pt-1 text-[11px] text-zinc-400 italic">
                      Пожелания клиента: {assigningOrder.options.byos.notes}
                    </div>
                  )}
                </div>
              )}

              {/* IP Address */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  IP-адрес VPS <span className="text-error-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="195.201.55.99"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 font-mono text-sm text-white placeholder-zinc-600 focus:border-accent-500 focus:outline-none"
                />
              </div>

              {/* RemnaWave Squad Selection */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-300">
                    RemnaWave Squad UUID <span className="text-error-400">*</span>
                  </label>
                  {squads.length > 0 && (
                    <span className="text-[11px] text-zinc-500">
                      Доступно сквадов: {squads.length}
                    </span>
                  )}
                </div>

                {squads.length > 0 && (
                  <select
                    value={squadUuid}
                    onChange={(e) => setSquadUuid(e.target.value)}
                    className="mb-2 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-zinc-200 focus:border-accent-500 focus:outline-none"
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
                  placeholder="f47ac10b-58cc-4372-a567-0e02b2c3d479"
                  value={squadUuid}
                  onChange={(e) => setSquadUuid(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 font-mono text-xs text-white placeholder-zinc-600 focus:border-accent-500 focus:outline-none"
                />
              </div>

              {/* Admin Notes */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Заметки администратора (опционально)
                </label>
                <textarea
                  rows={2}
                  placeholder="Например: Сервер Франкфурт Hetzner..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:border-accent-500 focus:outline-none"
                />
              </div>

              {/* Info Note */}
              <div className="rounded-xl border border-accent-500/20 bg-accent-500/10 p-3 text-xs text-accent-300">
                <div className="flex items-start gap-2">
                  <InfoIcon className="h-4 w-4 shrink-0 text-accent-400 mt-0.5" />
                  <span>
                    Бэкенд автоматически создаст подписку в RemnaWave с безлимитным трафиком, свяжет
                    её с заказом, переведёт статус в <b>active</b> и отправит пользователю сообщение
                    в Telegram со ссылкой.
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/[0.05]"
                >
                  {t('common.cancel', 'Отмена')}
                </button>
                <button
                  type="submit"
                  disabled={assignMutation.isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-accent-500 px-5 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-accent-400 disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4" />
                  {assignMutation.isPending ? 'Активация...' : 'Активировать и выдать клиенту'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {t('admin.dedicated.rejectTitle', 'Отклонение заказа')}
              </h3>
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="text-zinc-400 hover:text-white"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-xs text-zinc-300">
              Укажите причину отклонения заказа #{rejectingOrder.id}. Средства будут автоматически и
              мгновенно возвращены на баланс клиента.
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
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Причина отклонения <span className="text-error-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Например: Нет свободных IP в выбранной локации..."
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:border-error-500 focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-error-500/20 bg-error-500/10 p-3 text-xs text-error-400">
                Средства автоматически и мгновенно возвращаются на баланс пользователя, а заказ
                получит статус rejected.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingOrder(null)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/[0.05]"
                >
                  {t('common.cancel', 'Отмена')}
                </button>
                <button
                  type="submit"
                  disabled={rejectMutation.isPending}
                  className="rounded-xl bg-error-500 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-error-600 disabled:opacity-50"
                >
                  {rejectMutation.isPending ? 'Отклонение...' : 'Отклонить заказ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
