import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from '@/hooks/useTheme';
import { useNotify } from '@/platform';
import { getGlassColors } from '@/utils/glassTheme';
import { getFlagEmoji } from '@/utils/subscriptionHelpers';
import { copyToClipboard } from '@/utils/clipboard';
import { dedicatedServersApi, type DedicatedServerOrder } from '@/api/dedicatedServers';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import {
  ServerIcon,
  PlusIcon,
  CopyIcon,
  QrCodeIcon,
  ClockIcon,
  ShieldIcon,
  SparklesIcon,
  XIcon,
  TerminalIcon,
  InfoIcon,
  ChatIcon,
} from '@/components/icons';

export default function DedicatedServers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notify = useNotify();
  const { isDark } = useTheme();
  const g = getGlassColors(isDark);

  // Modals state
  const [activeQrServer, setActiveQrServer] = useState<DedicatedServerOrder | null>(null);
  const [activeScriptServer, setActiveScriptServer] = useState<DedicatedServerOrder | null>(null);
  const [selectedDetailServer, setSelectedDetailServer] = useState<DedicatedServerOrder | null>(
    null,
  );
  const [fetchedScript, setFetchedScript] = useState<string>('');
  const [isLoadingScript, setIsLoadingScript] = useState<boolean>(false);

  const handleOpenScript = async (server: DedicatedServerOrder) => {
    setActiveScriptServer(server);
    setFetchedScript(server.setup_script || '');
    setIsLoadingScript(true);
    try {
      const script = await dedicatedServersApi.getSetupScript(server.id);
      if (script) {
        setFetchedScript(script);
      }
    } catch {
      // Keep existing
    } finally {
      setIsLoadingScript(false);
    }
  };

  // Fetch servers
  const { data: servers = [], isLoading } = useQuery({
    queryKey: ['dedicated-servers-my'],
    queryFn: dedicatedServersApi.getMyServers,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const handleCopy = async (text: string, label: string) => {
    try {
      await copyToClipboard(text);
      notify.success(`${label} ${t('common.copied', 'скопировано в буфер')}`);
    } catch {
      notify.error(t('common.copyError', 'Не удалось скопировать'));
    }
  };

  const getStatusBadge = (status: string, compact = false) => {
    const s = status.toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {t('dedicated.status.active', 'Активен')}
        </span>
      );
    }
    if (s === 'pending' || s === 'setting_up') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 px-2.5 py-0.5 text-xs font-medium text-amber-400">
          <ClockIcon className="h-3 w-3 animate-spin text-amber-400" />
          {compact
            ? t('dedicated.status.settingUpShort', 'Настройка')
            : t('dedicated.status.pending', 'Сервер настраивается инженером (обычно 10–30 минут)')}
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/25 px-2.5 py-0.5 text-xs font-medium text-rose-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          {t('dedicated.status.rejected', 'Заказ отклонён')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 border border-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-zinc-300">
        {status}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: g.text }}>
            {t('dedicated.title', 'Личные серверы')}
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: g.textSecondary }}>
            {t('dedicated.subtitle', 'Персональные выделенные VPS без соседей и ограничений')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/servers/new')}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-600"
        >
          <PlusIcon className="h-4 w-4" />
          {t('dedicated.newServer', 'Заказать сервер')}
        </button>
      </div>

      {/* Servers list */}
      {isLoading ? (
        <SkeletonGroup className="space-y-4">
          <Skeleton variant="card" count={2} className="h-44" />
        </SkeletonGroup>
      ) : servers.length === 0 ? (
        /* Empty State */
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ background: g.cardBg, borderColor: g.cardBorder }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: g.innerBg }}
          >
            <ServerIcon className="h-8 w-8 text-dark-400 opacity-60" />
          </div>
          <h3 className="mb-2 text-lg font-semibold sm:text-xl" style={{ color: g.text }}>
            {t('dedicated.empty.title', 'У вас пока нет выделенных серверов')}
          </h3>
          <p className="mx-auto mb-6 max-w-md text-xs sm:text-sm text-dark-400">
            {t(
              'dedicated.empty.desc',
              'Закажите личный сервер с чистым IP, без лимитов на трафик и устройства, с доступом ко всем нейросетям и YouTube без рекламы.',
            )}
          </p>
          <button
            type="button"
            onClick={() => navigate('/servers/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-600"
          >
            <PlusIcon className="h-4 w-4" />
            {t('dedicated.empty.cta', 'Заказать личный сервер')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {servers.map((server) => {
            const flag = server.flag || getFlagEmoji(server.country_code);
            const isPending =
              server.status.toLowerCase() === 'pending' ||
              server.status.toLowerCase() === 'setting_up';
            const isActive = server.status.toLowerCase() === 'active';
            const isRejected = server.status.toLowerCase() === 'rejected';

            return (
              <div
                key={server.id}
                className="overflow-hidden rounded-2xl border p-5 transition-all"
                style={{ background: g.cardBg, borderColor: g.cardBorder }}
              >
                {/* Header row: Country + Status */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-dark-700/50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none">{flag || '🌐'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: g.text }}>
                          {server.country_name || server.country_code}
                        </span>
                        <span className="rounded bg-dark-700/60 px-1.5 py-0.5 text-xs text-dark-300">
                          {server.country_code}
                        </span>
                        <span className="text-xs text-dark-400">#{server.id}</span>
                      </div>
                      <span className="text-xs text-dark-400">
                        {server.deployment_type === 'turnkey'
                          ? t('dedicated.deployment.turnkey.label', 'Под ключ')
                          : t('dedicated.deployment.byos.label', 'Свой VPS (BYOS)')}
                      </span>
                    </div>
                  </div>

                  <div>{getStatusBadge(server.status)}</div>
                </div>

                {/* Rejected state banner */}
                {isRejected && (
                  <div className="mb-4 rounded-xl border border-error-500/30 bg-error-500/10 p-3.5 text-sm text-error-400">
                    <div className="font-medium">
                      {t('dedicated.rejected.reason', 'Причина отклонения')}:{' '}
                      <span className="text-error-300">
                        {server.rejected_reason || t('dedicated.rejected.noReason', 'Не указана')}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-error-400/80">
                      {t('dedicated.rejected.refund', 'Средства возвращены на баланс')}
                    </div>
                  </div>
                )}

                {/* Details grid */}
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* IP Address */}
                  <div className="rounded-xl border border-dark-700/60 bg-dark-800/40 p-3">
                    <span className="text-xs text-dark-400">
                      {t('dedicated.params.ip', 'Выделенный IP')}
                    </span>
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <span className="font-mono text-sm font-medium text-dark-200">
                        {server.ip_address || (
                          <span className="text-dark-500">
                            {isPending ? t('dedicated.params.assigning', 'Назначается...') : '—'}
                          </span>
                        )}
                      </span>
                      {server.ip_address && (
                        <button
                          type="button"
                          onClick={() => {
                            if (server.ip_address) {
                              handleCopy(server.ip_address, 'IP-адрес');
                            }
                          }}
                          className="rounded p-1 text-dark-400 transition-colors hover:bg-dark-700 hover:text-dark-200"
                          title="Скопировать IP"
                        >
                          <CopyIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expiration date / Period */}
                  <div className="rounded-xl border border-dark-700/60 bg-dark-800/40 p-3">
                    <span className="text-xs text-dark-400">
                      {t('dedicated.params.period', 'Срок действия')}
                    </span>
                    <div className="mt-1 text-sm font-medium text-dark-200">
                      {server.expires_at ? (
                        new Date(server.expires_at).toLocaleDateString()
                      ) : (
                        <span>{server.period_days} дней</span>
                      )}
                    </div>
                  </div>

                  {/* Active VIP Options */}
                  <div className="rounded-xl border border-dark-700/60 bg-dark-800/40 p-3">
                    <span className="text-xs text-dark-400">
                      {t('dedicated.params.options', 'Опции')}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {server.options?.ai_access && (
                        <span className="inline-flex items-center gap-1 rounded bg-accent-500/15 px-1.5 py-0.5 text-[11px] font-medium text-accent-400">
                          <SparklesIcon className="h-3 w-3" />
                          AI
                        </span>
                      )}
                      {server.options?.youtube_no_ads && (
                        <span className="inline-flex items-center gap-1 rounded bg-accent-500/15 px-1.5 py-0.5 text-[11px] font-medium text-accent-400">
                          <ShieldIcon className="h-3 w-3" />
                          No Ads
                        </span>
                      )}
                      {!server.options?.ai_access && !server.options?.youtube_no_ads && (
                        <span className="text-xs text-dark-500">—</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Details / Info button */}
                  <button
                    type="button"
                    onClick={() => setSelectedDetailServer(server)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-dark-200 transition-all hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white shadow-sm active:scale-[0.98]"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-md bg-accent-500/15 text-accent-400">
                      <InfoIcon className="h-3 w-3" />
                    </span>
                    {t('dedicated.actions.details', 'Детали сервера')}
                  </button>

                  {/* Actions for Active servers */}
                  {isActive && (
                    <>
                      {/* Copy subscription URL */}
                      {server.subscription_url && (
                        <button
                          type="button"
                          onClick={() => {
                            if (server.subscription_url) {
                              handleCopy(server.subscription_url, 'Ссылка на подписку');
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-dark-200 transition-all hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white shadow-sm active:scale-[0.98]"
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded-md bg-accent-500/15 text-accent-400">
                            <CopyIcon className="h-3 w-3" />
                          </span>
                          {t('dedicated.actions.copySub', 'Скопировать ссылку')}
                        </button>
                      )}

                      {/* QR code modal button */}
                      {server.subscription_url && (
                        <button
                          type="button"
                          onClick={() => setActiveQrServer(server)}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-dark-200 transition-all hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white shadow-sm active:scale-[0.98]"
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded-md bg-accent-500/15 text-accent-400">
                            <QrCodeIcon className="h-3 w-3" />
                          </span>
                          {t('dedicated.actions.qr', 'QR-код')}
                        </button>
                      )}
                    </>
                  )}

                  {/* BYOS Setup Script button */}
                  {server.deployment_type === 'byos' && (
                    <button
                      type="button"
                      onClick={() => handleOpenScript(server)}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-300 transition-all hover:bg-amber-500/20 hover:border-amber-500/40 shadow-sm active:scale-[0.98]"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
                        <TerminalIcon className="h-3 w-3" />
                      </span>
                      {t('dedicated.actions.setupCommand', 'Команда установки')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Server Details Modal */}
      {selectedDetailServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#121316] p-6 shadow-2xl shadow-black/80 text-left">
            {/* Modal Header */}
            <div className="mb-4 flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">
                  {selectedDetailServer.flag ||
                    getFlagEmoji(selectedDetailServer.country_code) ||
                    '🌐'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white">
                      {selectedDetailServer.country_name || selectedDetailServer.country_code}
                    </h3>
                    <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-xs text-zinc-400">
                      #{selectedDetailServer.id}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    {selectedDetailServer.deployment_type === 'turnkey'
                      ? t('dedicated.deployment.turnkey.label', 'Под ключ (Triton VPS)')
                      : t('dedicated.deployment.byos.label', 'Свой сервер (BYOS)')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedDetailServer.status, true)}
                <button
                  type="button"
                  onClick={() => setSelectedDetailServer(null)}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Status Informative Notice */}
            {(selectedDetailServer.status.toLowerCase() === 'pending' ||
              selectedDetailServer.status.toLowerCase() === 'setting_up') && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-left">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <ClockIcon className="h-4 w-4 animate-spin" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-amber-300">
                    Сервер настраивается инженером
                  </h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-200/80">
                    Обычно это занимает 10–30 минут. Как только сервер будет подключён, статус
                    изменится на «Активен», а персональная ссылка появится здесь и в Telegram.
                  </p>
                </div>
              </div>
            )}

            {selectedDetailServer.status.toLowerCase() === 'rejected' && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3.5 text-left">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                  <XIcon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-rose-300">Заказ отклонён</h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-rose-200/80">
                    {selectedDetailServer.rejected_reason
                      ? `Причина: ${selectedDetailServer.rejected_reason}. Средства автоматически возвращены на баланс.`
                      : 'Средства автоматически возвращены на баланс вашего аккаунта.'}
                  </p>
                </div>
              </div>
            )}

            {/* Server Specs & Info */}
            <div className="mb-4 space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm">
              <div className="flex items-center justify-between py-1 px-1">
                <span className="text-xs text-zinc-400">
                  {t('dedicated.params.ip', 'Выделенный IP')}
                </span>
                <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-zinc-200">
                  {selectedDetailServer.ip_address ? (
                    <>
                      <span>{selectedDetailServer.ip_address}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedDetailServer.ip_address!, 'IP-адрес')}
                        className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
                        title="Скопировать IP"
                      >
                        <CopyIcon className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <span className="font-sans text-zinc-500">
                      {selectedDetailServer.status === 'pending' ||
                      selectedDetailServer.status === 'setting_up'
                        ? t('dedicated.params.assigning', 'Назначается инженером...')
                        : '—'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.04] py-1 px-1 pt-2">
                <span className="text-xs text-zinc-400">
                  {t('dedicated.params.period', 'Срок действия')}
                </span>
                <span className="text-xs font-medium text-zinc-200">
                  {selectedDetailServer.expires_at ? (
                    new Date(selectedDetailServer.expires_at).toLocaleDateString()
                  ) : (
                    <span>{selectedDetailServer.period_days} дней</span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.04] py-1 px-1 pt-2">
                <span className="text-xs text-zinc-400">
                  {t('dedicated.params.options', 'Подключённые опции')}
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedDetailServer.options?.ai_access && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                      <SparklesIcon className="h-3 w-3" />
                      AI Доступ
                    </span>
                  )}
                  {selectedDetailServer.options?.youtube_no_ads && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                      <ShieldIcon className="h-3 w-3" />
                      YouTube без рекламы
                    </span>
                  )}
                  {!selectedDetailServer.options?.ai_access &&
                    !selectedDetailServer.options?.youtube_no_ads && (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                </div>
              </div>
            </div>

            {/* Engineer / Admin Notes if provided */}
            {selectedDetailServer.user_notes && (
              <div className="mb-4 rounded-xl border border-accent-500/25 bg-accent-500/5 p-3.5 text-left">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-400">
                  <InfoIcon className="h-3.5 w-3.5" />
                  {t(
                    'dedicated.details.adminNotesTitle',
                    'Информация и инструкции от администратора',
                  )}
                </div>
                <div className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-300">
                  {selectedDetailServer.user_notes}
                </div>
              </div>
            )}

            {/* Active Subscription Actions */}
            {selectedDetailServer.status.toLowerCase() === 'active' &&
              selectedDetailServer.subscription_url && (
                <div className="mb-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedDetailServer.subscription_url) {
                        handleCopy(selectedDetailServer.subscription_url, 'Ссылка подписки');
                      }
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-xs font-medium text-zinc-200 transition-all hover:bg-white/[0.08] hover:text-white"
                  >
                    <CopyIcon className="h-3.5 w-3.5 text-accent-400" />
                    {t('dedicated.actions.copySub', 'Скопировать ссылку')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const s = selectedDetailServer;
                      setSelectedDetailServer(null);
                      setActiveQrServer(s);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-xs font-medium text-zinc-200 transition-all hover:bg-white/[0.08] hover:text-white"
                  >
                    <QrCodeIcon className="h-3.5 w-3.5 text-accent-400" />
                    {t('dedicated.actions.qr', 'QR-код')}
                  </button>
                </div>
              )}

            {/* Support button & close */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedDetailServer(null);
                  navigate('/support');
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-2.5 text-xs font-semibold text-black shadow-md shadow-accent-500/15 transition-all hover:bg-accent-400 active:scale-[0.99]"
              >
                <ChatIcon className="h-4 w-4" />
                {t('dedicated.details.supportBtn', 'Написать в поддержку по серверу')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedDetailServer(null)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-200"
              >
                {t('common.close', 'Закрыть')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {activeQrServer?.subscription_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#121316] p-6 text-center shadow-2xl shadow-black/80">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-base font-semibold text-white">
                  {t('dedicated.qr.title', 'QR-код подключения')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQrServer(null)}
                className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="my-5 flex justify-center rounded-2xl bg-white p-4 shadow-inner">
              <QRCodeSVG
                value={activeQrServer.subscription_url}
                size={220}
                level="M"
                includeMargin
              />
            </div>

            <p className="mb-4 text-xs leading-relaxed text-zinc-400">
              {t(
                'dedicated.qr.hint',
                'Отсканируйте код камерой в приложении клиента для мгновенного добавления профиля.',
              )}
            </p>

            <button
              type="button"
              onClick={() => {
                if (activeQrServer?.subscription_url) {
                  handleCopy(activeQrServer.subscription_url, 'Ссылка подписки');
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-2.5 text-xs font-semibold text-black shadow-md shadow-accent-500/15 transition-all hover:bg-accent-400 active:scale-[0.99]"
            >
              <CopyIcon className="h-4 w-4" />
              {t('dedicated.actions.copySub', 'Скопировать ссылку подписки')}
            </button>
          </div>
        </div>
      )}

      {/* BYOS Setup Script Modal */}
      {activeScriptServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#121316] p-6 text-left shadow-2xl shadow-black/80">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalIcon className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">
                  {t('dedicated.byos.modalTitle', 'Команда установки на вашем VPS')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveScriptServer(null)}
                className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-3 text-xs leading-relaxed text-zinc-300">
              {t(
                'dedicated.byos.modalDesc',
                'Выполните команду на чистом сервере Ubuntu/Debian под пользователем root. Скрипт установит Docker, оптимизирует сеть (BBR), настроит фаервол (UFW) и подключит ноду к защищённой сети Triton:',
              )}
            </p>

            <div className="relative mb-4 rounded-xl border border-white/[0.08] bg-[#0c0d0f] p-3 font-mono text-xs text-zinc-200">
              {isLoadingScript && !fetchedScript ? (
                <div className="py-2 text-center text-zinc-500">Загрузка команды...</div>
              ) : (
                <pre className="overflow-x-auto whitespace-pre-wrap break-all">
                  {fetchedScript ||
                    activeScriptServer.setup_script ||
                    `curl -sSL https://get.remnawave.com/agent.sh | bash -s -- --token order_${activeScriptServer.id}`}
                </pre>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveScriptServer(null)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                {t('common.close', 'Закрыть')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const cmd =
                    fetchedScript ||
                    activeScriptServer.setup_script ||
                    `curl -sSL https://get.remnawave.com/agent.sh | bash -s -- --token order_${activeScriptServer.id}`;
                  handleCopy(cmd, 'Команда установки');
                }}
                className="flex items-center gap-1.5 rounded-xl bg-accent-500 px-4 py-2 text-xs font-semibold text-black shadow-md shadow-accent-500/15 transition-all hover:bg-accent-400 active:scale-[0.99]"
              >
                <CopyIcon className="h-3.5 w-3.5" />
                {t('common.copy', 'Скопировать команду')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
