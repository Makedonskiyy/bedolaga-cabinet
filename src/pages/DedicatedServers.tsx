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

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-500/15 px-2.5 py-0.5 text-xs font-medium text-success-400">
          <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
          {t('dedicated.status.active', 'Активен')}
        </span>
      );
    }
    if (s === 'pending' || s === 'setting_up') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-500/15 px-2.5 py-0.5 text-xs font-medium text-warning-400">
          <ClockIcon className="h-3 w-3 animate-spin text-warning-400" />
          {t('dedicated.status.pending', 'Сервер настраивается инженером (обычно 10–30 минут)')}
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-error-500/15 px-2.5 py-0.5 text-xs font-medium text-error-400">
          <span className="h-1.5 w-1.5 rounded-full bg-error-400" />
          {t('dedicated.status.rejected', 'Заказ отклонён')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-dark-700 px-2.5 py-0.5 text-xs font-medium text-dark-300">
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

                {/* Actions row for Active servers */}
                {isActive && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Copy subscription URL */}
                    {server.subscription_url && (
                      <button
                        type="button"
                        onClick={() => {
                          if (server.subscription_url) {
                            handleCopy(server.subscription_url, 'Ссылка на подписку');
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-xl border border-dark-700 bg-dark-800/60 px-3.5 py-2 text-xs font-medium text-dark-200 transition-colors hover:border-dark-600 hover:bg-dark-700/60"
                      >
                        <CopyIcon className="h-3.5 w-3.5 text-accent-400" />
                        {t('dedicated.actions.copySub', 'Скопировать ссылку подписки')}
                      </button>
                    )}

                    {/* QR code modal button */}
                    {server.subscription_url && (
                      <button
                        type="button"
                        onClick={() => setActiveQrServer(server)}
                        className="flex items-center gap-1.5 rounded-xl border border-dark-700 bg-dark-800/60 px-3.5 py-2 text-xs font-medium text-dark-200 transition-colors hover:border-dark-600 hover:bg-dark-700/60"
                      >
                        <QrCodeIcon className="h-3.5 w-3.5 text-accent-400" />
                        {t('dedicated.actions.qr', 'QR-код')}
                      </button>
                    )}

                    {/* BYOS Setup Script button */}
                    {server.deployment_type === 'byos' && (
                      <button
                        type="button"
                        onClick={() => handleOpenScript(server)}
                        className="flex items-center gap-1.5 rounded-xl border border-dark-700 bg-dark-800/60 px-3.5 py-2 text-xs font-medium text-dark-200 transition-colors hover:border-dark-600 hover:bg-dark-700/60"
                      >
                        <TerminalIcon className="h-3.5 w-3.5 text-warning-400" />
                        {t('dedicated.actions.setupCommand', 'Команда установки')}
                      </button>
                    )}
                  </div>
                )}

                {/* For BYOS pending server, still allow viewing script if available */}
                {isPending && server.deployment_type === 'byos' && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenScript(server)}
                      className="flex items-center gap-1.5 rounded-xl border border-dark-700 bg-dark-800/60 px-3.5 py-2 text-xs font-medium text-dark-200 transition-colors hover:border-dark-600 hover:bg-dark-700/60"
                    >
                      <TerminalIcon className="h-3.5 w-3.5 text-warning-400" />
                      {t('dedicated.actions.setupCommand', 'Команда установки')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {activeQrServer?.subscription_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/70 p-4">
          <div
            className="w-full max-w-sm rounded-2xl border p-6 text-center shadow-2xl"
            style={{ background: g.cardBg, borderColor: g.cardBorder }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-base font-semibold text-dark-100">
                  {t('dedicated.qr.title', 'QR-код подключения')}
                </h3>
                <p className="text-xs text-dark-400">Happ, v2rayNG, Hiddify, Streisand</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveQrServer(null)}
                className="text-dark-400 hover:text-dark-200"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="my-5 flex justify-center rounded-2xl bg-white p-4">
              <QRCodeSVG
                value={activeQrServer.subscription_url}
                size={220}
                level="M"
                includeMargin
              />
            </div>

            <p className="mb-4 text-xs text-dark-400">
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-2.5 text-xs font-semibold text-on-accent transition-colors hover:bg-accent-600"
            >
              <CopyIcon className="h-4 w-4" />
              {t('dedicated.actions.copySub', 'Скопировать ссылку подписки')}
            </button>
          </div>
        </div>
      )}

      {/* BYOS Setup Script Modal */}
      {activeScriptServer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/70 p-4">
          <div
            className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl"
            style={{ background: g.cardBg, borderColor: g.cardBorder }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TerminalIcon className="h-5 w-5 text-warning-400" />
                <h3 className="text-base font-semibold text-dark-100">
                  {t('dedicated.byos.modalTitle', 'Команда установки на вашем VPS')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveScriptServer(null)}
                className="text-dark-400 hover:text-dark-200"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-3 text-xs text-dark-300">
              {t(
                'dedicated.byos.modalDesc',
                'Подключитесь к вашему VPS по SSH под пользователем root и выполните следующую команду:',
              )}
            </p>

            <div className="relative mb-4 rounded-xl border border-dark-700 bg-dark-900/90 p-3 font-mono text-xs text-dark-100">
              {isLoadingScript && !fetchedScript ? (
                <div className="py-2 text-center text-dark-400">Загрузка команды...</div>
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
                className="rounded-xl border border-dark-700 px-4 py-2 text-xs font-semibold text-dark-300 transition-colors hover:bg-dark-800"
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
                className="flex items-center gap-1.5 rounded-xl bg-accent-500 px-4 py-2 text-xs font-semibold text-on-accent transition-colors hover:bg-accent-600"
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
