import type React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { GrainGradient } from '@paper-design/shaders-react';
import { useAuthStore } from '../store/auth';
import { useShallow } from 'zustand/shallow';
import { authApi } from '../api/auth';
import { isValidEmail } from '../utils/validation';
import {
  brandingApi,
  getCachedBranding,
  setCachedBranding,
  preloadLogo,
  isLogoPreloaded,
  type BrandingInfo,
  type EmailAuthEnabled,
  type TelegramWidgetConfig,
} from '../api/branding';
import { getAndClearReturnUrl, tokenStorage } from '../utils/token';
import { getApiErrorMessage } from '../utils/api-error';
import { isInTelegramWebApp, getTelegramInitData, useTelegramSDK } from '../hooks/useTelegramSDK';
import { closeMiniApp } from '@telegram-apps/sdk-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import TelegramLoginButton from '../components/TelegramLoginButton';
import OAuthProviderIcon from '../components/OAuthProviderIcon';
import { saveOAuthState } from '../utils/oauth';
import { getPendingReferralCode } from '../utils/referral';
import { UsersIcon, EmailIcon, RefreshIcon } from '@/components/icons';
import LegalFooter from '../components/LegalFooter';
import LegalConsent from '../components/LegalConsent';
import LegalConsentGate from '../components/LegalConsentGate';
import { useLegalConsentGate } from '../hooks/useLegalConsentGate';
import { infoApi } from '../api/info';
import type { LegalConsentConfig } from '../types';
import { safeLocal, safeSession } from '../utils/safeStorage';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    isLoading: isAuthInitializing,
    loginWithTelegram,
    loginWithEmail,
    registerWithEmail,
  } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      loginWithTelegram: state.loginWithTelegram,
      loginWithEmail: state.loginWithEmail,
      registerWithEmail: state.registerWithEmail,
    })),
  );

  // Referral code captured from URL
  const referralCode = getPendingReferralCode() || '';

  const [authMode, setAuthMode] = useState<'login' | 'register'>(() =>
    referralCode ? 'register' : 'login',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(() => isLogoPreloaded());
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [isTelegramQrOpen, setIsTelegramQrOpen] = useState(false);

  // Legal consent gate for new users (HTTP 428)
  const { data: legalConsent } = useQuery<LegalConsentConfig>({
    queryKey: ['legal-consent-config', i18n.language],
    queryFn: () => infoApi.getLegalConsentConfig(i18n.language),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const consent = useLegalConsentGate(legalConsent);

  // Telegram safe area insets
  const { safeAreaInset, contentSafeAreaInset } = useTelegramSDK();
  const safeTop = Math.max(safeAreaInset.top, contentSafeAreaInset.top);
  const safeBottom = Math.max(safeAreaInset.bottom, contentSafeAreaInset.bottom);

  // Return URL after successful auth
  const getReturnUrl = useCallback(() => {
    const stateFrom = (location.state as { from?: string })?.from;
    if (stateFrom && stateFrom !== '/login') {
      return stateFrom;
    }
    const savedUrl = getAndClearReturnUrl();
    if (savedUrl && savedUrl !== '/login') {
      return savedUrl;
    }
    return '/';
  }, [location.state]);

  // Branding cache
  const cachedBranding = useMemo(() => getCachedBranding(), []);

  const { data: branding } = useQuery<BrandingInfo>({
    queryKey: ['branding'],
    queryFn: async () => {
      const data = await brandingApi.getBranding();
      setCachedBranding(data);
      await preloadLogo(data);
      return data;
    },
    staleTime: 60000,
    initialData: cachedBranding ?? undefined,
    initialDataUpdatedAt: 0,
  });

  const { data: emailAuthConfig } = useQuery<EmailAuthEnabled>({
    queryKey: ['email-auth-enabled'],
    queryFn: brandingApi.getEmailAuthEnabled,
    staleTime: 60000,
  });
  const isEmailAuthEnabled = emailAuthConfig?.enabled ?? true;

  const { data: footerEnabled } = useQuery({
    queryKey: ['footer-enabled'],
    queryFn: brandingApi.getFooterEnabled,
    staleTime: 60000,
  });

  const { data: oauthData } = useQuery({
    queryKey: ['oauth-providers'],
    queryFn: authApi.getOAuthProviders,
    staleTime: 60000,
  });
  const oauthProviders = Array.isArray(oauthData?.providers) ? oauthData.providers : [];

  const { data: widgetConfig } = useQuery<TelegramWidgetConfig>({
    queryKey: ['telegram-widget-config'],
    queryFn: brandingApi.getTelegramWidgetConfig,
    staleTime: 60000,
  });

  const botUsername =
    widgetConfig?.bot_username || import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';

  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const handleOAuthLogin = async (provider: string) => {
    setError('');
    setOauthLoading(provider);
    try {
      const { authorize_url, state } = await authApi.getOAuthAuthorizeUrl(provider);

      let parsed: URL;
      try {
        parsed = new URL(authorize_url);
      } catch {
        throw new Error('Invalid OAuth redirect URL');
      }
      if (parsed.protocol !== 'https:') {
        throw new Error('Invalid OAuth redirect URL');
      }

      if (!saveOAuthState(state, provider)) {
        throw new Error('OAuth state is not persistable');
      }
      window.location.href = authorize_url;
    } catch {
      setError(t('auth.oauthError', 'Authorization was denied or failed'));
      setOauthLoading(null);
    }
  };

  const appName = branding ? branding.name : import.meta.env.VITE_APP_NAME || 'VPN';
  const appLogo = branding?.logo_letter || import.meta.env.VITE_APP_LOGO || 'V';
  const logoUrl = branding ? brandingApi.getLogoUrl(branding) : null;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getReturnUrl(), { replace: true });
    }
  }, [isAuthenticated, navigate, getReturnUrl]);

  // Auto Telegram WebApp authentication
  useEffect(() => {
    if (isAuthInitializing) return;

    const tryTelegramAuth = async () => {
      const initData = getTelegramInitData();
      if (!isInTelegramWebApp() || !initData) return;

      setIsTelegramWebApp(true);
      setIsLoading(true);

      const MAX_RETRIES = 1;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          await loginWithTelegram(initData);
          navigate(getReturnUrl(), { replace: true });
          return;
        } catch (err) {
          const error = err as { response?: { status?: number } };
          const status = error.response?.status;
          const detail = getApiErrorMessage(err, '');
          if (import.meta.env.DEV)
            console.warn(`Telegram auth attempt ${attempt + 1} failed:`, status, detail);

          const needsConsent = consent.capture(err, async (accepted) => {
            await loginWithTelegram(initData, accepted);
            navigate(getReturnUrl(), { replace: true });
          });
          if (needsConsent) {
            setIsLoading(false);
            return;
          }

          if (status === 401 && attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }

          setError(detail || t('auth.telegramRequired'));
        }
      }

      setIsLoading(false);
    };

    tryTelegramAuth();
  }, [isAuthInitializing, loginWithTelegram, navigate, t, getReturnUrl, consent.capture]);

  const handleRetryTelegramAuth = () => {
    tokenStorage.clearTokens();
    safeSession.removeItem('tapps/launchParams');
    safeSession.removeItem('telegram_init_data');
    safeLocal.removeItem('cabinet-auth');
    safeLocal.removeItem('tg_user_id');

    try {
      closeMiniApp();
    } catch {
      window.location.reload();
    }
  };

  const handleEmailSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !isValidEmail(email.trim())) {
      setError(t('auth.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    if (authMode === 'register') {
      if (password !== confirmPassword) {
        setError(t('auth.passwordMismatch', 'Passwords do not match'));
        return;
      }
      if (password.length < 8) {
        setError(t('auth.passwordTooShort', 'Password must be at least 8 characters'));
        return;
      }
    }

    setIsLoading(true);

    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
        navigate(getReturnUrl(), { replace: true });
      } else {
        const result = await registerWithEmail(
          email,
          password,
          firstName || undefined,
          referralCode || undefined,
          consent.acceptedKeys,
        );
        setRegisteredEmail(result.email);
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      const status = error.response?.status;
      const detail = getApiErrorMessage(err, '');

      const needsConsent = consent.capture(err, async (accepted) => {
        const retried = await registerWithEmail(
          email,
          password,
          firstName || undefined,
          referralCode || undefined,
          accepted,
        );
        setRegisteredEmail(retried.email);
      });
      if (needsConsent) {
        setIsLoading(false);
        return;
      }

      if (status === 400 && detail.includes('already registered')) {
        setError(t('auth.emailAlreadyRegistered', 'This email is already registered'));
      } else if (status === 401 || status === 403) {
        if (detail.includes('verify your email')) {
          setError(t('auth.emailNotVerified', 'Please verify your email first'));
        } else {
          setError(t('auth.invalidCredentials', 'Invalid email or password'));
        }
      } else if (status === 429) {
        setError(t('auth.tooManyAttempts', 'Too many attempts. Please try again later'));
      } else {
        setError(detail || t('common.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setForgotPasswordError('');

    if (!forgotPasswordEmail.trim() || !isValidEmail(forgotPasswordEmail.trim())) {
      setForgotPasswordError(t('auth.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    setForgotPasswordLoading(true);
    try {
      await authApi.forgotPassword(forgotPasswordEmail.trim());
      setForgotPasswordSent(true);
    } catch (err: unknown) {
      setForgotPasswordError(getApiErrorMessage(err, t('common.error')));
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setForgotPasswordSent(false);
    setForgotPasswordError('');
  };

  return (
    <section
      className="min-h-screen bg-white p-3 text-black antialiased [font-synthesis:none] dark:bg-[#050505] dark:text-white"
      style={{
        paddingTop:
          safeTop > 0 ? `${safeTop + 12}px` : 'calc(0.75rem + env(safe-area-inset-top, 0px))',
        paddingBottom:
          safeBottom > 0
            ? `${safeBottom + 12}px`
            : 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        {/* Left Side: Auth Form Container */}
        <div className="relative flex min-h-[720px] items-start rounded-2xl border border-black/15 bg-white px-6 py-10 sm:px-10 dark:border-white/10 dark:bg-[#0a0a0a] lg:min-h-0 lg:px-12 lg:py-16 xl:px-16">
          {/* Top Right Header Controls */}
          <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
            <LanguageSwitcher />
          </div>

          <div className="mx-auto w-full max-w-[540px]">
            {/* Logo and Brand */}
            <div className="mb-6 flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.05]">
                <span
                  className={`text-base font-bold text-black dark:text-white transition-opacity duration-200 ${
                    branding?.has_custom_logo && logoLoaded ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  {appLogo}
                </span>
                {branding?.has_custom_logo && logoUrl && (
                  <img
                    src={logoUrl}
                    alt={appName || 'Logo'}
                    className={`absolute h-full w-full object-contain transition-opacity duration-200 ${
                      logoLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => setLogoLoaded(true)}
                  />
                )}
              </div>
              <span className="text-xl font-bold tracking-tight text-black dark:text-white">
                {appName}
              </span>
            </div>

            {/* Heading and Subtitle */}
            <div className="mb-6">
              <h1 className="text-3xl font-medium tracking-[-0.04em] sm:text-4xl lg:text-[40px] lg:leading-[1.05]">
                {showForgotPassword
                  ? t('auth.resetPasswordTitle', 'Сброс пароля')
                  : authMode === 'login'
                    ? t('auth.welcomeBack', 'Добро пожаловать!')
                    : t('auth.register', 'Регистрация')}
              </h1>
              <p className="mt-2 text-base text-black/60 dark:text-white/55 sm:text-lg">
                {showForgotPassword
                  ? t(
                      'auth.forgotPasswordHint',
                      'Введите email для получения инструкций по сбросу пароля.',
                    )
                  : authMode === 'login'
                    ? t('auth.loginSubtitle', 'Быстрый, безопасный и приватный доступ к сети')
                    : t('auth.registerSubtitle', 'Приватный доступ в интернет в пару кликов')}
              </p>
            </div>

            {/* Referral Banner */}
            {referralCode && isEmailAuthEnabled && !showForgotPassword && (
              <div className="mb-6 rounded-xl border border-black/15 bg-black/[0.03] p-3 dark:border-white/15 dark:bg-white/[0.04]">
                <div className="flex items-center gap-2.5 text-black/80 dark:text-white/80">
                  <UsersIcon className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-medium">{t('auth.referralInvite')}</span>
                </div>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
              >
                {error}
              </div>
            )}

            {/* 428 Consent Gate */}
            {consent.pending ? (
              <div className="my-6">
                <LegalConsentGate gate={consent} />
              </div>
            ) : registeredEmail ? (
              /* Check Email Screen */
              <div className="rounded-xl border border-black/15 bg-black/[0.02] p-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/[0.05] dark:bg-white/[0.08]">
                  <EmailIcon className="h-7 w-7 text-black dark:text-white" />
                </div>
                <h2 className="mb-2 text-xl font-medium text-black dark:text-white">
                  {t('auth.checkEmail', 'Check your email')}
                </h2>
                <p className="mb-2 text-sm text-black/60 dark:text-white/60">
                  {t('auth.verificationSent', 'We sent a verification link to:')}
                </p>
                <p className="mb-4 text-sm font-semibold text-black dark:text-white">
                  {registeredEmail}
                </p>
                <p className="mb-6 text-xs text-black/40 dark:text-white/40">
                  {t(
                    'auth.clickLinkToVerify',
                    'Click the link in the email to verify your account and log in.',
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRegisteredEmail(null);
                    setAuthMode('login');
                  }}
                  className="flex h-11 w-full items-center justify-center rounded-[10px] border border-black/30 bg-black text-sm font-medium text-white transition-colors hover:bg-black/85 dark:border-white/30 dark:bg-white dark:text-black dark:hover:bg-white/85"
                >
                  {t('auth.backToLogin', 'Back to login')}
                </button>
              </div>
            ) : showForgotPassword ? (
              /* Forgot Password Form */
              <div className="space-y-4">
                {forgotPasswordSent ? (
                  <div className="rounded-xl border border-black/15 bg-black/[0.02] p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.05] dark:bg-white/[0.08]">
                      <EmailIcon className="h-6 w-6 text-black dark:text-white" />
                    </div>
                    <p className="text-base font-medium text-black dark:text-white">
                      {t('auth.checkEmail', 'Check your email')}
                    </p>
                    <p className="mt-2 text-xs text-black/60 dark:text-white/50">
                      {t(
                        'auth.passwordResetSent',
                        'If an account exists with this email, we sent password reset instructions.',
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={closeForgotPasswordModal}
                      className="mt-6 inline-flex text-sm font-medium text-black underline underline-offset-4 dark:text-white"
                    >
                      {t('common.back', 'Back to login')}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <FieldBox
                      label="Email"
                      id="forgotEmail"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                    {forgotPasswordError && (
                      <p className="text-sm text-red-500">{forgotPasswordError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={forgotPasswordLoading}
                      className="flex h-14 w-full items-center justify-center rounded-xl border border-black/40 bg-black text-base sm:text-lg font-medium text-white transition-all hover:bg-black/85 active:scale-[0.99] dark:border-white/40 dark:bg-white dark:text-black dark:hover:bg-white/85 disabled:opacity-50"
                    >
                      {forgotPasswordLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black" />
                          {t('common.loading')}
                        </span>
                      ) : (
                        t('auth.sendResetLink', 'Send reset link')
                      )}
                    </button>
                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={closeForgotPasswordModal}
                        className="text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                      >
                        {t('common.back', 'Back to login')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Main Auth Options */
              <div className="space-y-6">
                {/* Switch between Login and Register */}
                {isEmailAuthEnabled && (
                  <div className="grid grid-cols-2 gap-1 rounded-[10px] border border-black/15 bg-black/[0.04] p-1 dark:border-white/15 dark:bg-white/[0.04]">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setError('');
                      }}
                      className={`rounded-[8px] py-2 text-sm font-medium transition-all ${
                        authMode === 'login'
                          ? 'bg-white text-black shadow-sm dark:bg-white dark:text-black'
                          : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
                      }`}
                    >
                      {t('auth.login', 'Вход')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setError('');
                      }}
                      className={`rounded-[8px] py-2 text-sm font-medium transition-all ${
                        authMode === 'register'
                          ? 'bg-white text-black shadow-sm dark:bg-white dark:text-black'
                          : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
                      }`}
                    >
                      {t('auth.register', 'Регистрация')}
                    </button>
                  </div>
                )}

                {/* Telegram Auth Block */}
                <div className="space-y-3">
                  {isLoading && isTelegramWebApp ? (
                    <div className="rounded-xl border border-black/10 bg-black/[0.02] py-8 text-center dark:border-white/10 dark:bg-white/[0.02]">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent dark:border-white" />
                      <p className="text-sm text-black/60 dark:text-white/60">
                        {t('auth.authenticating', 'Authenticating with Telegram...')}
                      </p>
                    </div>
                  ) : isTelegramWebApp && error ? (
                    <div className="space-y-3 text-center">
                      <button
                        onClick={handleRetryTelegramAuth}
                        className="mx-auto flex h-11 items-center gap-2 rounded-[10px] border border-black/40 bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-black/85 dark:border-white/40 dark:bg-white dark:text-black dark:hover:bg-white/85"
                      >
                        <RefreshIcon className="h-4 w-4" />
                        {t('auth.tryAgain', 'Try again')}
                      </button>
                      <p className="text-xs text-black/50 dark:text-white/50">
                        {t(
                          'auth.telegramReopenHint',
                          'If the problem persists, close and reopen the app',
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <TelegramLoginButton
                        referralCode={referralCode || undefined}
                        hideAlternativeBotButton={true}
                        manualDeepLink={isTelegramQrOpen}
                        onDeepLinkChange={setIsTelegramQrOpen}
                      />
                    </div>
                  )}
                </div>

                {/* Show alternative auth options only when QR mode is not active */}
                {!isTelegramQrOpen && (
                  <>
                    {/* Divider between Telegram Widget and Alternative Methods */}
                    <div className="my-5 flex items-center gap-4 text-center">
                      <div className="h-px flex-1 bg-black/15 dark:bg-white/10" />
                      <span className="text-xs font-medium text-black/50 dark:text-white/40">
                        {t('auth.orAlternative', 'или другие способы')}
                      </span>
                      <div className="h-px flex-1 bg-black/15 dark:bg-white/10" />
                    </div>

                    {/* Quick & OAuth Buttons (Google, Apple, Telegram Bot QR, etc.) */}
                    <div
                      className={`grid gap-3 ${
                        oauthProviders.length === 0 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
                      }`}
                    >
                      {/* OAuth Providers (Google, etc.) */}
                      {oauthProviders.map((provider, idx) => {
                        const totalButtons = oauthProviders.length + 1; // +1 for Telegram Bot
                        const isOddTotal = totalButtons % 2 !== 0;
                        const isLastOAuth = idx === oauthProviders.length - 1;

                        return (
                          <button
                            key={provider.name}
                            type="button"
                            onClick={() => handleOAuthLogin(provider.name)}
                            disabled={oauthLoading !== null}
                            className={`flex h-14 items-center justify-center gap-3 rounded-xl border border-black/15 bg-black/[0.02] px-4 text-sm sm:text-base font-medium text-black transition-all hover:bg-black/[0.05] active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08] disabled:opacity-50 ${
                              isOddTotal && isLastOAuth ? 'sm:col-span-2' : ''
                            }`}
                          >
                            {oauthLoading === provider.name ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/40 border-t-black dark:border-white/40 dark:border-t-white" />
                            ) : (
                              <OAuthProviderIcon
                                provider={provider.name}
                                className="h-5 w-5 shrink-0"
                              />
                            )}
                            <span className="truncate">
                              {t('auth.continueWith', 'Войти через')} {provider.display_name}
                            </span>
                          </button>
                        );
                      })}

                      {/* Telegram Bot / QR button */}
                      <button
                        type="button"
                        onClick={() => setIsTelegramQrOpen(true)}
                        className={`flex h-14 items-center justify-center gap-3 rounded-xl border border-black/15 bg-black/[0.02] px-4 text-sm sm:text-base font-medium text-black transition-all hover:bg-black/[0.05] active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08] ${
                          oauthProviders.length === 0 ? 'sm:col-span-2' : ''
                        }`}
                      >
                        <OAuthProviderIcon provider="telegram" className="h-5 w-5 shrink-0" />
                        <span className="truncate">
                          {t('auth.loginWithBot', 'Войти через бота')}
                        </span>
                      </button>
                    </div>

                    {/* Divider before Email */}
                    {isEmailAuthEnabled && (
                      <div className="my-6 flex items-center gap-4 text-center">
                        <div className="h-px flex-1 bg-black/15 dark:bg-white/10" />
                        <span className="text-sm font-medium text-black/50 dark:text-white/40">
                          {t('auth.orEmail', 'или с помощью email')}
                        </span>
                        <div className="h-px flex-1 bg-black/15 dark:bg-white/10" />
                      </div>
                    )}
                  </>
                )}

                {/* Email & Password Form */}
                {isEmailAuthEnabled && (
                  <form className="space-y-4 sm:space-y-5" onSubmit={handleEmailSubmit}>
                    {authMode === 'register' && (
                      <FieldBox
                        label={t('auth.firstName', 'Имя')}
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder={t('auth.firstNamePlaceholder', 'Ваше имя')}
                        autoComplete="given-name"
                      />
                    )}

                    <FieldBox
                      label={t('auth.email', 'Email')}
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />

                    <FieldBox
                      label={t('auth.password', 'Пароль')}
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    />

                    {authMode === 'register' && (
                      <FieldBox
                        label={t('auth.confirmPassword', 'Повторите')}
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                      />
                    )}

                    {authMode === 'register' && (
                      <div className="pt-1">
                        <LegalConsent
                          documents={consent.documents}
                          accepted={consent.accepted}
                          onChange={consent.toggle}
                          disabled={isLoading}
                          className="pt-1"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || (authMode === 'register' && !consent.allAccepted)}
                      className="mt-7 flex h-14 w-full items-center justify-center rounded-xl border border-black/40 bg-black text-base sm:text-lg font-medium text-white transition-all hover:bg-black/85 active:scale-[0.99] dark:border-white/40 dark:bg-white dark:text-black dark:hover:bg-white/85 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black" />
                          {t('common.loading', 'Загрузка...')}
                        </span>
                      ) : authMode === 'login' ? (
                        t('auth.login', 'Войти')
                      ) : (
                        t('auth.register', 'Зарегистрироваться')
                      )}
                    </button>

                    {authMode === 'login' && (
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-black/60 underline underline-offset-4 transition-colors hover:text-black dark:text-white/60 dark:hover:text-white"
                        >
                          {t('auth.forgotPassword', 'Forgot password?')}
                        </button>
                      </div>
                    )}

                    {authMode === 'register' && (
                      <p className="text-center text-xs text-black/50 dark:text-white/40">
                        {t(
                          'auth.verificationEmailNotice',
                          'After registration, a verification email will be sent to your address',
                        )}
                      </p>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* Legal Footer */}
            {footerEnabled && (
              <div className="mt-8 border-t border-black/10 pt-4 dark:border-white/10">
                <LegalFooter />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Visual Canvas Banner (SolaceUI with GrainGradient) */}
        <div className="relative hidden min-h-[720px] overflow-hidden rounded-2xl bg-black p-8 text-white sm:p-12 lg:flex lg:min-h-0">
          <GrainGradient
            speed={1}
            scale={1}
            rotation={0}
            offsetX={0}
            offsetY={0}
            softness={0.5}
            intensity={0.5}
            noise={0.25}
            shape="corners"
            frame={2854.5}
            colors={['#6DFFCC', '#19AA77', '#19AA77', '#6DFFCC']}
            colorBack="#00000000"
            className="absolute inset-0 bg-black"
          />

          <div className="relative z-10 flex h-full w-full flex-col justify-between">
            <div className="pt-4 lg:pt-10">
              <h2 className="max-w-[620px] text-4xl font-medium tracking-[-0.04em] text-white sm:text-5xl lg:text-[52px] lg:leading-[1.08] xl:text-[60px]">
                Обеспечиваем свободный вход в интернет 1 кнопкой.
              </h2>

              <p className="mt-5 max-w-md text-lg text-white/70 leading-relaxed">
                Высокоскоростной и приватный доступ на всех ваших устройствах с современными
                протоколами без ограничений.
              </p>
            </div>

            <div className="space-y-4 pt-10">
              {botUsername ? (
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-13 sm:h-14 max-w-full items-center gap-3.5 rounded-xl border border-white/25 bg-white/10 px-6 text-base sm:text-lg font-medium text-white backdrop-blur-md transition-colors hover:border-white/50 hover:bg-white/20"
                >
                  <TelegramIcon className="size-7 shrink-0 text-white" />
                  <span className="truncate whitespace-nowrap">@{botUsername}</span>
                </a>
              ) : (
                <div className="inline-flex h-13 sm:h-14 items-center gap-3.5 rounded-xl border border-white/25 bg-white/10 px-6 text-base sm:text-lg font-medium text-white backdrop-blur-md">
                  <WindowsIcon className="size-6 shrink-0 text-white" />
                  <span>Поддержка ПК и смартфонов</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Reusable SolaceUI FieldBox
function FieldBox({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="relative flex h-14 sm:h-16 items-center justify-between gap-4 rounded-xl border border-black/20 bg-white px-5 text-base sm:text-lg transition-all focus-within:border-black/50 focus-within:ring-2 focus-within:ring-black/5 dark:border-white/15 dark:bg-white/5 dark:focus-within:border-white/40 dark:focus-within:ring-white/10"
    >
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="h-full min-w-0 flex-1 truncate bg-transparent text-black outline-none placeholder:text-black/35 dark:text-white dark:placeholder:text-white/35 text-base sm:text-lg"
      />
      <span className="shrink-0 text-xs sm:text-sm font-semibold uppercase tracking-wider text-black/50 dark:text-white/40 select-none">
        {label}
      </span>
    </label>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 4.7 10.7 3.6v7.7H3V4.7Zm8.8-1.25L21 2.1v9.2h-9.2V3.45ZM3 12.7h7.7v7.7L3 19.3v-6.6Zm8.8 0H21v9.2l-9.2-1.3v-7.9Z" />
    </svg>
  );
}
