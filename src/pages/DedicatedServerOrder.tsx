import { useState, useMemo, useEffect, useRef } from 'react';
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
  SparklesIcon,
  WalletIcon,
  XIcon,
  InfoIcon,
  CpuIcon,
  ChevronDownIcon,
} from '@/components/icons';

type ContinentFilter = 'all' | 'europe' | 'america' | 'asia';

function isMatchContinent(c: DedicatedCountry, tab: ContinentFilter) {
  if (tab === 'all') return true;
  const cont = (c.continent || '').toLowerCase().trim();
  const code = (c.code || '').toUpperCase().trim();

  if (tab === 'america') {
    return (
      cont === 'america' ||
      cont === 'americas' ||
      cont.includes('americ') ||
      cont === 'north_america' ||
      cont === 'south_america' ||
      cont === 'na' ||
      cont === 'sa' ||
      ['US', 'CA', 'BR', 'MX', 'AR', 'CL', 'CO'].includes(code)
    );
  }
  if (tab === 'europe') {
    return (
      cont === 'europe' ||
      cont.includes('europ') ||
      cont === 'eu' ||
      [
        'DE',
        'NL',
        'FI',
        'GB',
        'FR',
        'SE',
        'CH',
        'PL',
        'ES',
        'IT',
        'AT',
        'CZ',
        'NO',
        'EE',
        'LV',
        'LT',
        'UA',
        'RO',
        'BG',
      ].includes(code)
    );
  }
  if (tab === 'asia') {
    return (
      cont === 'asia' ||
      cont.includes('asia') ||
      cont === 'as' ||
      cont === 'me' ||
      ['SG', 'JP', 'TR', 'AE', 'KR', 'HK', 'IN', 'KZ', 'IL'].includes(code)
    );
  }
  return cont === tab;
}

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
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState<boolean>(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
      }
    }
    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCountryDropdownOpen]);

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
    return countries.filter((c) => isMatchContinent(c, continent));
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

      <div className="space-y-8">
        {/* Step 1: Country selection (Dropdown) */}
        <section>
          <label
            className="mb-3 block text-sm font-semibold sm:text-base"
            style={{ color: g.text }}
          >
            {t('dedicated.step.country', '1. Выберите страну размещения')}
          </label>

          <div ref={countryDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
              aria-expanded={isCountryDropdownOpen}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left backdrop-blur-2xl transition-all duration-200 ${
                isCountryDropdownOpen
                  ? 'border-accent-500/80 bg-accent-500/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl leading-none">
                  {selectedCountry?.flag || getFlagEmoji(selectedCountryCode) || '🌐'}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="truncate text-sm font-semibold sm:text-base"
                      style={{ color: g.text }}
                    >
                      {selectedCountry?.name || selectedCountryCode}
                    </span>
                    <span className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-xs text-dark-300">
                      {selectedCountryCode}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 capitalize">
                    {selectedCountry?.continent
                      ? t(
                          `dedicated.continents.${selectedCountry.continent}`,
                          selectedCountry.continent,
                        )
                      : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-dark-400">
                <ChevronDownIcon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isCountryDropdownOpen ? 'rotate-180 text-accent-400' : ''
                  }`}
                />
              </div>
            </button>

            {/* Dropdown Menu */}
            {isCountryDropdownOpen && (
              <div
                className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl"
                style={{
                  background: isDark ? 'rgba(20, 20, 26, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                }}
              >
                {/* Continent filter tabs inside dropdown */}
                <div className="border-b border-white/[0.08] p-2.5">
                  <div className="flex rounded-xl border border-white/[0.06] bg-black/40 p-1 text-xs backdrop-blur-md gap-1">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setContinent(tab.id);
                        }}
                        className={`flex-1 rounded-lg py-1.5 font-medium text-center transition-all ${
                          continent === tab.id
                            ? 'bg-accent-500 text-black font-semibold'
                            : 'text-dark-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country items */}
                <div className="max-h-60 overflow-y-auto divide-y divide-white/[0.04] p-1.5">
                  {filteredCountries.map((c: DedicatedCountry) => {
                    const isSelected = selectedCountryCode === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountryCode(c.code);
                          setIsCountryDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-colors ${
                          isSelected
                            ? 'bg-accent-500/15 text-accent-300 font-medium'
                            : 'hover:bg-white/[0.06] text-dark-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl leading-none">
                            {c.flag || getFlagEmoji(c.code) || '🌐'}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-dark-100 truncate">
                              {c.name}
                            </div>
                            <div className="text-xs text-dark-400 capitalize">
                              {t(`dedicated.continents.${c.continent}`, c.continent)} • {c.code}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-black">
                            <CheckIcon className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {filteredCountries.length === 0 && (
                    <div className="py-6 text-center text-xs text-dark-400">
                      {t('common.notFound', 'Ничего не найдено')}
                    </div>
                  )}
                </div>
              </div>
            )}
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
                  className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left backdrop-blur-xl transition-all duration-200 ${
                    isSelected
                      ? 'border-accent-500/80 bg-accent-500/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]'
                      : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: g.text }}>
                      {p.label || `${months} мес.`}
                    </span>
                    {p.discount_percent > 0 && (
                      <span className="rounded-full border border-success-500/25 bg-success-500/15 px-2 py-0.5 text-[11px] font-bold text-success-300">
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
              className={`flex items-start gap-3.5 rounded-2xl border p-4.5 text-left backdrop-blur-xl transition-all duration-200 ${
                deploymentType === 'turnkey'
                  ? 'border-accent-500/80 bg-accent-500/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
              }`}
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400">
                <ServerIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: g.text }}>
                    {t('dedicated.deployment.turnkey.title', 'Под ключ (Turnkey)')}
                  </span>
                  {deploymentType === 'turnkey' && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-black">
                      <CheckIcon className="h-3 w-3 stroke-[3]" />
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
              className={`flex items-start gap-3.5 rounded-2xl border p-4.5 text-left backdrop-blur-xl transition-all duration-200 ${
                deploymentType === 'byos'
                  ? 'border-accent-500/80 bg-accent-500/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
              }`}
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400">
                <CpuIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: g.text }}>
                    {t('dedicated.deployment.byos.title', 'Свой сервер (BYOS)')}
                  </span>
                  {deploymentType === 'byos' && (
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-black">
                      <CheckIcon className="h-3 w-3 stroke-[3]" />
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

        {/* Step 4: Additional options */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-accent-400" />
            <label className="text-sm font-semibold sm:text-base" style={{ color: g.text }}>
              {t('dedicated.step.options', '4. Доп. опции')}
            </label>
          </div>
          <div className="space-y-2.5">
            {/* AI access option */}
            <label className="flex cursor-pointer items-start gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05]">
              <input
                type="checkbox"
                checked={aiAccess}
                onChange={(e) => setAiAccess(e.target.checked)}
                className="hidden"
              />
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                  aiAccess
                    ? 'border-accent-500 bg-accent-500'
                    : 'border-white/20 bg-white/[0.03] hover:border-white/40'
                }`}
                aria-hidden="true"
              >
                {aiAccess && <CheckIcon className="h-3.5 w-3.5 stroke-[3] text-black" />}
              </div>
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
              <span className="rounded-full border border-accent-500/30 bg-accent-500/15 px-2.5 py-0.5 text-xs font-semibold text-accent-400">
                {t('dedicated.options.included', 'Включено')}
              </span>
            </label>

            {/* YouTube no ads option */}
            <label className="flex cursor-pointer items-start gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05]">
              <input
                type="checkbox"
                checked={youtubeNoAds}
                onChange={(e) => setYoutubeNoAds(e.target.checked)}
                className="hidden"
              />
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                  youtubeNoAds
                    ? 'border-accent-500 bg-accent-500'
                    : 'border-white/20 bg-white/[0.03] hover:border-white/40'
                }`}
                aria-hidden="true"
              >
                {youtubeNoAds && <CheckIcon className="h-3.5 w-3.5 stroke-[3] text-black" />}
              </div>
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
              <span className="rounded-full border border-accent-500/30 bg-accent-500/15 px-2.5 py-0.5 text-xs font-semibold text-accent-400">
                {t('dedicated.options.included', 'Включено')}
              </span>
            </label>
          </div>
        </section>

        {/* Summary Card & Payment */}
        <div
          className="rounded-3xl border border-white/[0.08] p-5 sm:p-6 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
          style={{ background: isDark ? 'rgba(20, 20, 26, 0.6)' : 'rgba(255, 255, 255, 0.6)' }}
        >
          <div className="mb-4 flex flex-col justify-between gap-2 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center">
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

          {/* Action button — clean, flat, NO glowing shadows */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={orderMutation.isPending || isConfigLoading}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-transform active:scale-[0.99] disabled:opacity-50 ${
              hasSufficientBalance
                ? 'bg-accent-500 text-black hover:bg-accent-400'
                : 'border border-error-500/30 bg-error-500/15 text-error-400 hover:bg-error-500/25'
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
