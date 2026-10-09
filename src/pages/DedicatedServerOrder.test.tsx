// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DedicatedServerOrder from './DedicatedServerOrder';
import { dedicatedServersApi } from '@/api/dedicatedServers';
import { useAuthStore } from '@/store/auth';
import i18n from '@/i18n';

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

vi.mock('@/api/dedicatedServers', () => ({
  dedicatedServersApi: {
    getConfig: vi.fn(),
    createOrder: vi.fn(),
  },
}));

vi.mock('@/platform', () => ({
  useNotify: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
  usePlatform: () => ({
    platform: 'web',
  }),
}));

describe('DedicatedServerOrder page', () => {
  let queryClient: QueryClient;

  afterEach(() => {
    cleanup();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('ru');
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.mocked(dedicatedServersApi.getConfig).mockResolvedValue({
      base_price_rubles: 500,
      countries: [
        { code: 'DE', name: 'Германия', continent: 'europe', available: true },
        { code: 'US', name: 'США', continent: 'america', available: true },
      ],
      periods: [
        { period_days: 30, discount_percent: 0, label: '1 месяц' },
        { period_days: 90, discount_percent: 10, label: '3 месяца' },
      ],
      options: {
        ai_access: {
          id: 'ai_access',
          name: 'AI Access',
          description: 'Доступ ко всем нейросетям',
          price_rubles: 0,
        },
        youtube_no_ads: {
          id: 'youtube_no_ads',
          name: 'YouTube No Ads',
          description: 'YouTube без рекламы',
          price_rubles: 0,
        },
      },
      marketing: {
        headline: '100% ваш сервер без соседей',
      },
    });
  });

  it('renders order configuration options and banner', async () => {
    useAuthStore.setState({
      user: {
        id: 1,
        telegram_id: 12345,
        username: 'testuser',
        first_name: 'Test',
        last_name: null,
        email: 'test@example.com',
        email_verified: true,
        balance_kopeks: 100000,
        balance_rubles: 1000,
        referral_code: null,
        language: 'ru',
        created_at: new Date().toISOString(),
        auth_type: 'telegram',
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DedicatedServerOrder />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const germanyElements = await screen.findAllByText('Германия');
    expect(germanyElements.length).toBeGreaterThan(0);

    expect(screen.getByText('США')).toBeTruthy();
    expect(screen.getAllByText('1 месяц').length).toBeGreaterThan(0);
    expect(screen.getByText('3 месяца')).toBeTruthy();
    expect(screen.getByText(/Доступ ко всем заблокированным нейросетям/i)).toBeTruthy();
    expect(screen.getByText(/YouTube без рекламы на всех устройствах/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Оплатить с баланса/i })).toBeTruthy();
  });

  it('shows insufficient balance warning when balance is too low', async () => {
    useAuthStore.setState({
      user: {
        id: 1,
        telegram_id: 12345,
        username: 'testuser',
        first_name: 'Test',
        last_name: null,
        email: 'test@example.com',
        email_verified: true,
        balance_kopeks: 10000,
        balance_rubles: 100, // 100 RUB < 500 RUB
        referral_code: null,
        language: 'ru',
        created_at: new Date().toISOString(),
        auth_type: 'telegram',
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DedicatedServerOrder />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const germanyElements = await screen.findAllByText('Германия');
    expect(germanyElements.length).toBeGreaterThan(0);

    const topUpButton = screen.getByRole('button', {
      name: /Пополнить баланс/i,
    });
    expect(topUpButton).toBeTruthy();

    fireEvent.click(topUpButton);
    expect(
      screen.getByText(/Для заказа выделенного сервера на вашем балансе не хватает средств/i),
    ).toBeTruthy();
  });

  it('submits order when user has sufficient balance', async () => {
    useAuthStore.setState({
      user: {
        id: 1,
        telegram_id: 12345,
        username: 'testuser',
        first_name: 'Test',
        last_name: null,
        email: 'test@example.com',
        email_verified: true,
        balance_kopeks: 100000,
        balance_rubles: 1000, // 1000 RUB >= 500 RUB
        referral_code: null,
        language: 'ru',
        created_at: new Date().toISOString(),
        auth_type: 'telegram',
      },
    });

    vi.mocked(dedicatedServersApi.createOrder).mockResolvedValue({
      id: 999,
      message: 'Created',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DedicatedServerOrder />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const germanyElements = await screen.findAllByText('Германия');
    expect(germanyElements.length).toBeGreaterThan(0);

    const payButton = screen.getByRole('button', {
      name: /Оплатить с баланса/i,
    });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(dedicatedServersApi.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          country_code: 'DE',
          period_days: 30,
          deployment_type: 'turnkey',
          options: {
            ai_access: true,
            youtube_no_ads: true,
          },
        }),
      );
    });
  });
});
