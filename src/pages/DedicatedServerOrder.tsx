import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WebBackButton } from '@/components/WebBackButton';
import { useAuthStore } from '@/store/auth';
import { useTheme } from '@/hooks/useTheme';
import { useCurrency } from '@/hooks/useCurrency';
import { useNotify } from '@/platform';
import { getGlassColors } from '@/utils/glassTheme';
import { getFlagEmoji } from '@/utils/subscriptionHelpers';
import { getApiErrorMessage } from '@/utils/api-error';
import {
  dedicatedServersApi,
  type DedicatedCountry,
  type DedicatedPeriodDiscount,
} from '@/api/dedicatedServers';
import {
  ServerIcon,
  CheckIcon,
  ShieldIcon,
  SparklesIcon,
  WalletIcon,
  XIcon,
  InfoIcon,
  CpuIcon,
} from '@/components/icons';

type ContinentFilter = 'all' | 'europe' | 'america' | 'asia';

export default function DedicatedServerOrder() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const { isDark } = useTheme();
  const g = getGlassColors(isDark);
  const { formatAmount, currencySymbol } = useCurrency();

  const user = useAuthStore((state) => state.user);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  // Form state
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('DE');
  const [selectedPeriodDays, setSelectedPeriodDays] = useState<number>(30);
  const [deploymentType, setDeploymentType] = useState<'turnkey' | 'byos'>('turnkey');
  const [aiAccess, setAiAccess] = useState<boolean>(true);
  const [youtubeNoAds, setYoutubeNoAds] = useState<boolean>(true);
  const [continent, setContinent] = useState<ContinentFilter>('all');
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);

  // Load config
  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ['dedicated-servers-config'],
    queryFn: dedicatedServersApi.getConfig,
    staleTime: 60_000,
  });

  const countries = config?.countries || [];
  const periods = config?.periods || [];
  const basePriceRubles = config?.base_price_rubles || 590;

  // Filtered countries
  const filteredCountries = useMemo(() => {
    if (continent === 'all') return countries;
    return countries.filter((c) => c.continent === continent);
  }, [countries, continent]);

  // Selected period discount
  const activePeriod = useMemo<DedicatedPeriodDiscount>(() => {
    const found = periods.find((p) => p.period_days === selectedPeriodDays);
    return found || { period_days: selectedPeriodDays, discount_percent: 0, label: '1 месяц' };
  }, [periods, selectedPeriodDays]);

  // Price calculations
  const calculatePrice = useMemo(() => {
    const months = Math.max(1, Math.round(selectedPeriodDays / 30));
    const rawTotal = basePriceRubles * months;
    const discount = (rawTotal * (activePeriod.discount_percent || 0)) / 100;
    const total = Math.round(rawTotal - discount);
    return {
      monthlyRate: Math.round(total / months),
      rawTotal,
      discount,
      total,
    };
  }, [basePriceRubles, selectedPeriodDays, activePeriod]);

  // User balance
  const userBalanceRubles = useMemo(() => {
    if (!user) return 0;
    if (user.balance_rubles !== undefined && user.balance_rubles !== null) {
      return user.balance_rubles;
    }
    return (user.balance_kopeks || 0) / 100;
  }, [user]);

  const missingBalanceRubles = Math.max(0, calculatePrice.total - userBalanceRubles);
  const hasSufficientBalance = userBalanceRubles >= calculatePrice.total;

  // Create order mutation
  const orderMutation = useMutation({
    mutationFn: async () => {
      return dedicatedServersApi.createOrder({
        country_code: selectedCountryCode,
        period_days: selectedPeriodDays,
        deployment_type: deploymentType,
        options: {
          ai_access: aiAccess,
          youtube_no_ads: youtubeNoAds,
        },
      });
    },
    onSuccess: async () => {
      notify.success(t('dedicated.order.success', 'Сервер успешно заказан! Начинается настройка.'));
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['dedicated-servers-my'] });
      navigate('/servers');
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err, t('dedicated.order.error', 'Ошибка оформления заказа'));
      if (
        msg.toLowerCase().includes('balance') ||
        msg.toLowerCase().includes('баланс') ||
        msg.toLowerCase().includes('funds')
      ) {
        setShowTopUpModal(true);
      } else {
        notify.error(msg);
      }
    },
  });

  const handleSubmit = () => {
    if (!hasSufficientBalance) {
      setShowTopUpModal(true);
      return;
    }
    orderMutation.mutate();
  };

  const selectedCountry = countries.find((c) => c.code === selectedCountryCode);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <WebBackButton to="/servers" />
        <div>
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: g.text }}>
            {t('dedicated.order.title', 'Заказ личного сервера')}
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: g.textSecondary }}>
            {t('dedicated.order.subtitle', 'Выделенный VPS с персональным IP и без ограничений')}
          </p>
        </div>
      </div>

      {/* Benefits banner */}
      <div
        className="mb-8 rounded-2xl border p-4 sm:p-5"
        style={{
          background: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: g.cardBorder,
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400">
              <ShieldIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-accent-400">
                {t('dedicated.banner.badge', 'Dedicated VPS')}
              </div>
              <p
                className="text-sm font-medium leading-relaxed sm:text-base"
                style={{ color: g.text }}
              >
                {t(
                  'dedicated.banner.text',
                  '100% ваш сервер без соседей • 0 лимитов на трафик и устройства • Чистый IP',
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Step 1: Continent filter & Country selection */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-semibold sm:text-base" style={{ color: g.text }}>
              {t('dedicated.step.country', '1. Выберите страну размещения')}
            </label>
            <div className="flex rounded-lg border border-dark-700/60 bg-dark-900/60 p-0.5 text-xs">
              {(
                [
                  { id: 'all', label: t('dedicated.continents.all', 'Все') },
                  { id: 'europe', label: t('dedicated.continents.europe', 'Европа') },
                  { id: 'america', label: t('dedicated.continents.america', 'Америка') },
                  { id: 'asia', label: t('dedicated.continents.asia', 'Азия') },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setContinent(tab.id)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                    continent === tab.id
                      ? 'bg-accent-500 text-on-accent'
                      : 'text-dark-400 hover:text-dark-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {filteredCountries.map((c: DedicatedCountry) => {
              const isSelected = selectedCountryCode === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedCountryCode(c.code)}
                  className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-accent-500 bg-accent-500/10 shadow-sm'
                      : 'border-dark-700/60 bg-dark-800/40 hover:border-dark-600'
                  }`}
                >
                  <span className="text-2xl leading-none">
                    {c.flag || getFlagEmoji(c.code) || '🌐'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium" style={{ color: g.text }}>
                        {c.name}
                      </span>
                    </div>
                    <span className="text-xs text-dark-400">{c.code}</span>
                  </div>
                  {isSelected && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-on-accent">
                      <CheckIcon className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Period selection */}
        <section>
          <label
            className="mb-3 block text-sm font-semibold sm:text-base"
            style={{ color: g.text }}
          >
            {t('dedicated.step.period', '2. Срок аренды')}
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {periods.map((p) => {
              const isSelected = selectedPeriodDays === p.period_days;
              const months = Math.max(1, Math.round(p.period_days / 30));
              const rawTotal = basePriceRubles * months;
              const disc = (rawTotal * (p.discount_percent || 0)) / 100;
              const periodTotal = Math.round(rawTotal - disc);

              return (
                <button
                  key={p.period_days}
                  type="button"
                  onClick={() => setSelectedPeriodDays(p.period_days)}
                  className={`relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-accent-500 bg-accent-500/10'
                      : 'border-dark-700/60 bg-dark-800/40 hover:border-dark-600'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: g.text }}>
                      {p.label || `${months} мес.`}
                    </span>
                    {p.discount_percent > 0 && (
                      <span className="rounded bg-success-500/15 px-1.5 py-0.5 text-[11px] font-bold text-success-400">
                        -{p.discount_percent}%
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-base font-bold text-accent-400">
                      {formatAmount(periodTotal)}&nbsp;{currencySymbol}
                    </div>
                    {months > 1 && (
                      <div className="text-[11px] text-dark-400">
                        {formatAmount(Math.round(periodTotal / months))}&nbsp;{currencySymbol}/мес
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3: Deployment type */}
        <section>
          <label
            className="mb-3 block text-sm font-semibold sm:text-base"
            style={{ color: g.text }}
          >
            {t('dedicated.step.deployment', '3. Тип развёртывания')}
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setDeploymentType('turnkey')}
              className={`flex items-start gap-3.5 rounded-xl border p-4 text-left transition-all ${
                deploymentType === 'turnkey'
                  ? 'border-accent-500 bg-accent-500/10'
                  : 'border-dark-700/60 bg-dark-800/40 hover:border-dark-600'
              }`}
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
                <ServerIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: g.text }}>
                    {t('dedicated.deployment.turnkey.title', 'Под ключ (Turnkey)')}
                  </span>
                  {deploymentType === 'turnkey' && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-on-accent">
                      <CheckIcon className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-dark-400">
                  {t(
                    'dedicated.deployment.turnkey.desc',
                    'Мы предоставим VPS и всё настроим за вас. Сервер готов к работе сразу после активации инженером.',
                  )}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDeploymentType('byos')}
              className={`flex items-start gap-3.5 rounded-xl border p-4 text-left transition-all ${
                deploymentType === 'byos'
                  ? 'border-accent-500 bg-accent-500/10'
                  : 'border-dark-700/60 bg-dark-800/40 hover:border-dark-600'
              }`}
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400">
                <CpuIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: g.text }}>
                    {t('dedicated.deployment.byos.title', 'Свой сервер (BYOS)')}
                  </span>
                  {deploymentType === 'byos' && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-on-accent">
                      <CheckIcon className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-dark-400">
                  {t(
                    'dedicated.deployment.byos.desc',
                    'Используйте свой личный VPS. Мы предоставим команду для автоматического запуска и подключения.',
                  )}
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Step 4: VIP options */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-accent-400" />
            <label className="text-sm font-semibold sm:text-base" style={{ color: g.text }}>
              {t('dedicated.step.options', '4. VIP-опции')}
            </label>
          </div>
          <div className="space-y-2.5">
            {/* AI access option */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-dark-700/60 bg-dark-800/40 p-3.5 transition-colors hover:border-dark-600">
              <input
                type="checkbox"
                checked={aiAccess}
                onChange={(e) => setAiAccess(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-dark-600 text-accent-500 focus:ring-accent-500"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium" style={{ color: g.text }}>
                  {t('dedicated.options.ai.title', 'Доступ ко всем заблокированным нейросетям')}
                </div>
                <p className="mt-0.5 text-xs text-dark-400">
                  {t(
                    'dedicated.options.ai.desc',
                    'Полный доступ к Gemini, ChatGPT, Claude, Perplexity без ограничений гео-локации.',
                  )}
                </p>
              </div>
              <span className="rounded bg-accent-500/15 px-2 py-0.5 text-xs font-semibold text-accent-400">
                {t('dedicated.options.included', 'Включено')}
              </span>
            </label>

            {/* YouTube no ads option */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-dark-700/60 bg-dark-800/40 p-3.5 transition-colors hover:border-dark-600">
              <input
                type="checkbox"
                checked={youtubeNoAds}
                onChange={(e) => setYoutubeNoAds(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-dark-600 text-accent-500 focus:ring-accent-500"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium" style={{ color: g.text }}>
                  {t('dedicated.options.youtube.title', 'YouTube без рекламы на всех устройствах')}
                </div>
                <p className="mt-0.5 text-xs text-dark-400">
                  {t(
                    'dedicated.options.youtube.desc',
                    'Фильтрация рекламных блоков на стороне сервера без необходимости сторонних расширений.',
                  )}
                </p>
              </div>
              <span className="rounded bg-accent-500/15 px-2 py-0.5 text-xs font-semibold text-accent-400">
                {t('dedicated.options.included', 'Включено')}
              </span>
            </label>
          </div>
        </section>

        {/* Summary Card & Payment */}
        <div
          className="rounded-2xl border p-4 sm:p-6"
          style={{ background: g.cardBg, borderColor: g.cardBorder }}
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-dark-700/50 pb-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-xs uppercase tracking-wider text-dark-400">
                {t('dedicated.summary.heading', 'Итоговый расчёт')}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg">
                  {selectedCountry?.flag || getFlagEmoji(selectedCountryCode)}
                </span>
                <span className="font-semibold text-dark-100">
                  {selectedCountry?.name || selectedCountryCode}
                </span>
                <span className="text-dark-500">•</span>
                <span className="text-sm text-dark-300">
                  {activePeriod.label || `${Math.round(selectedPeriodDays / 30)} мес.`}
                </span>
                <span className="text-dark-500">•</span>
                <span className="text-xs text-dark-400">
                  {deploymentType === 'turnkey' ? 'Под ключ' : 'Свой VPS'}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-2xl font-bold text-accent-400">
                {formatAmount(calculatePrice.total)}&nbsp;{currencySymbol}
              </div>
              {calculatePrice.discount > 0 && (
                <div className="text-xs text-success-400">
                  {t('dedicated.summary.savings', 'Экономия')}{' '}
                  {formatAmount(calculatePrice.discount)}&nbsp;{currencySymbol}
                </div>
              )}
            </div>
          </div>

          {/* User balance status */}
          <div className="mb-4 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-dark-400">{t('balance.title', 'Ваш баланс')}:</span>
            <span
              className={`font-semibold ${
                hasSufficientBalance ? 'text-dark-200' : 'text-error-400'
              }`}
            >
              {formatAmount(userBalanceRubles)}&nbsp;{currencySymbol}
            </span>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={orderMutation.isPending || isConfigLoading}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
              hasSufficientBalance
                ? 'bg-accent-500 text-on-accent hover:bg-accent-600'
                : 'bg-error-500/20 text-error-400 hover:bg-error-500/30'
            }`}
          >
            <WalletIcon className="h-4 w-4" />
            {orderMutation.isPending
              ? t('dedicated.order.submitting', 'Оформление заказа...')
              : hasSufficientBalance
                ? t('dedicated.order.payFromBalance', 'Оплатить с баланса')
                : `${t('dedicated.order.needTopUp', 'Пополнить баланс (не хватает')} ${formatAmount(
                    missingBalanceRubles,
                  )}\u00A0${currencySymbol})`}
          </button>
        </div>
      </div>

      {/* Insufficient funds modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/70 p-4">
          <div
            className="w-full max-w-sm rounded-2xl border p-6 shadow-xl"
            style={{ background: g.cardBg, borderColor: g.cardBorder }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-warning-400">
                <InfoIcon className="h-5 w-5" />
                <h3 className="text-base font-semibold text-dark-100">
                  {t('dedicated.topup.title', 'Недостаточно средств')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="text-dark-400 hover:text-dark-200"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-3 text-sm text-dark-300">
              {t(
                'dedicated.topup.desc',
                'Для заказа выделенного сервера на вашем балансе не хватает средств.',
              )}
            </p>

            <div className="mb-5 rounded-xl border border-dark-700/60 bg-dark-800/40 p-3.5">
              <div className="flex justify-between text-xs text-dark-400">
                <span>{t('dedicated.topup.price', 'Стоимость заказа')}:</span>
                <span className="font-semibold text-dark-200">
                  {formatAmount(calculatePrice.total)}&nbsp;{currencySymbol}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-dark-400">
                <span>{t('balance.title', 'Ваш баланс')}:</span>
                <span className="font-semibold text-dark-200">
                  {formatAmount(userBalanceRubles)}&nbsp;{currencySymbol}
                </span>
              </div>
              <div className="mt-2 border-t border-dark-700/50 pt-2 flex justify-between text-sm font-semibold">
                <span className="text-error-400">
                  {t('dedicated.topup.missing', 'Не хватает')}:
                </span>
                <span className="text-error-400">
                  {formatAmount(missingBalanceRubles)}&nbsp;{currencySymbol}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="flex-1 rounded-xl border border-dark-700 py-2.5 text-xs font-semibold text-dark-300 transition-colors hover:bg-dark-800"
              >
                {t('common.cancel', 'Отмена')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTopUpModal(false);
                  navigate(
                    `/balance/top-up?amount=${Math.ceil(missingBalanceRubles)}&returnTo=/servers/new`,
                  );
                }}
                className="flex-1 rounded-xl bg-accent-500 py-2.5 text-xs font-semibold text-on-accent transition-colors hover:bg-accent-600"
              >
                {t('balance.topUp', 'Пополнить баланс')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
