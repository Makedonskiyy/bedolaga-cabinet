// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DedicatedServers from './DedicatedServers';
import { dedicatedServersApi } from '@/api/dedicatedServers';
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
    getMyServers: vi.fn(),
  },
}));

vi.mock('@/platform', () => ({
  useNotify: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('@/utils/clipboard', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
}));

describe('DedicatedServers page', () => {
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
  });

  it('renders empty state when user has no dedicated servers', async () => {
    vi.mocked(dedicatedServersApi.getMyServers).mockResolvedValue([]);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DedicatedServers />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText(/У вас пока нет выделенных серверов|You have no dedicated servers/i),
    ).toBeTruthy();
    expect(screen.getByText(/Заказать личный сервер|Order personal server/i)).toBeTruthy();
  });

  it('renders server card with details and active status', async () => {
    vi.mocked(dedicatedServersApi.getMyServers).mockResolvedValue([
      {
        id: 101,
        country_code: 'DE',
        country_name: 'Германия',
        status: 'active',
        ip_address: '195.201.55.99',
        period_days: 30,
        deployment_type: 'turnkey',
        options: {
          ai_access: true,
          youtube_no_ads: true,
        },
        subscription_url: 'https://sub.example.com/token123',
        created_at: new Date().toISOString(),
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DedicatedServers />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Германия')).toBeTruthy();
    expect(screen.getByText('195.201.55.99')).toBeTruthy();
    expect(screen.getByText(/Активен|Active/i)).toBeTruthy();
    expect(screen.getByText(/Скопировать ссылку подписки|Copy subscription link/i)).toBeTruthy();
    expect(screen.getByText(/QR-код|QR code/i)).toBeTruthy();
  });

  it('renders pending status and message for configuring server', async () => {
    vi.mocked(dedicatedServersApi.getMyServers).mockResolvedValue([
      {
        id: 102,
        country_code: 'NL',
        country_name: 'Нидерланды',
        status: 'pending',
        period_days: 90,
        deployment_type: 'byos',
        options: {
          ai_access: true,
        },
        setup_script: 'curl -sSL https://get.remnawave.com/agent.sh | bash',
        created_at: new Date().toISOString(),
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DedicatedServers />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Нидерланды')).toBeTruthy();
    expect(
      screen.getByText(/Сервер настраивается инженером|Server is being configured/i),
    ).toBeTruthy();
    expect(screen.getByText(/Команда установки|Setup command/i)).toBeTruthy();
  });

  it('renders rejected status with reason and refund message', async () => {
    vi.mocked(dedicatedServersApi.getMyServers).mockResolvedValue([
      {
        id: 103,
        country_code: 'US',
        country_name: 'США',
        status: 'rejected',
        rejected_reason: 'Нет свободных IP в регионе',
        period_days: 30,
        deployment_type: 'turnkey',
        options: {},
        created_at: new Date().toISOString(),
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DedicatedServers />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('США')).toBeTruthy();
    expect(screen.getByText(/Заказ отклонён|Order rejected/i)).toBeTruthy();
    expect(screen.getByText('Нет свободных IP в регионе')).toBeTruthy();
    expect(
      screen.getByText(/Средства возвращены на баланс|Funds returned to balance/i),
    ).toBeTruthy();
  });
});
