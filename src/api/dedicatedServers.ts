import apiClient from './client';

export interface DedicatedCountry {
  code: string;
  name: string;
  continent: 'europe' | 'america' | 'asia' | string;
  flag?: string;
  base_price_rubles?: number;
  available?: boolean;
}

export interface DedicatedPeriodDiscount {
  period_days: number;
  discount_percent: number;
  label?: string;
}

export interface DedicatedOptionConfig {
  id: string;
  name: string;
  description: string;
  price_rubles?: number;
}

export interface DedicatedMarketing {
  headline?: string;
  benefits?: string[];
}

export interface DedicatedServersConfigResponse {
  countries: DedicatedCountry[];
  periods: DedicatedPeriodDiscount[];
  options: {
    ai_access?: DedicatedOptionConfig;
    youtube_no_ads?: DedicatedOptionConfig;
    [key: string]: DedicatedOptionConfig | undefined;
  };
  marketing?: DedicatedMarketing;
  base_price_rubles?: number;
}

export interface DedicatedServerOrder {
  id: number;
  user_id?: number;
  username?: string | null;
  email?: string | null;
  telegram_id?: number | null;
  country_code: string;
  country_name?: string;
  flag?: string;
  status: 'pending' | 'setting_up' | 'active' | 'rejected' | string;
  ip_address?: string | null;
  squad_uuid?: string | null;
  period_days: number;
  deployment_type: 'turnkey' | 'byos' | string;
  options: {
    ai_access?: boolean;
    youtube_no_ads?: boolean;
    [key: string]: boolean | undefined;
  };
  subscription_url?: string | null;
  setup_script?: string | null;
  rejected_reason?: string | null;
  admin_notes?: string | null;
  price_rubles?: number;
  price_kopeks?: number;
  created_at: string;
  expires_at?: string | null;
}

export interface CreateDedicatedOrderRequest {
  country_code: string;
  period_days: number;
  deployment_type: 'turnkey' | 'byos';
  options: {
    ai_access: boolean;
    youtube_no_ads: boolean;
    [key: string]: boolean;
  };
}

export interface AssignDedicatedOrderRequest {
  ip_address: string;
  squad_uuid: string;
  admin_notes?: string;
}

export interface RejectDedicatedOrderRequest {
  reason: string;
}

// Fallback configuration if backend config endpoint is not yet configured or returns partial data
export const DEFAULT_DEDICATED_CONFIG: DedicatedServersConfigResponse = {
  base_price_rubles: 590,
  marketing: {
    headline: '100% ваш сервер без соседей • 0 лимитов на трафик и устройства • Чистый IP',
    benefits: [
      '100% ваш сервер без соседей',
      '0 лимитов на трафик и устройства',
      'Чистый IP-адрес без блокировок',
    ],
  },
  periods: [
    { period_days: 30, discount_percent: 0, label: '1 месяц' },
    { period_days: 90, discount_percent: 10, label: '3 месяца' },
    { period_days: 180, discount_percent: 15, label: '6 месяцев' },
    { period_days: 365, discount_percent: 22, label: '1 год' },
  ],
  options: {
    ai_access: {
      id: 'ai_access',
      name: 'Доступ ко всем нейросетям',
      description:
        'Доступ ко всем заблокированным нейросетям (Gemini, ChatGPT, Claude, Perplexity)',
      price_rubles: 0,
    },
    youtube_no_ads: {
      id: 'youtube_no_ads',
      name: 'YouTube без рекламы',
      description: 'YouTube без рекламы на всех устройствах',
      price_rubles: 0,
    },
  },
  countries: [
    // Europe
    { code: 'DE', name: 'Германия', continent: 'europe', available: true },
    { code: 'NL', name: 'Нидерланды', continent: 'europe', available: true },
    { code: 'FI', name: 'Финляндия', continent: 'europe', available: true },
    { code: 'GB', name: 'Великобритания', continent: 'europe', available: true },
    { code: 'FR', name: 'Франция', continent: 'europe', available: true },
    { code: 'SE', name: 'Швеция', continent: 'europe', available: true },
    { code: 'CH', name: 'Швейцария', continent: 'europe', available: true },
    { code: 'PL', name: 'Польша', continent: 'europe', available: true },
    // America
    { code: 'US', name: 'США', continent: 'america', available: true },
    { code: 'CA', name: 'Канада', continent: 'america', available: true },
    { code: 'BR', name: 'Бразилия', continent: 'america', available: true },
    // Asia
    { code: 'SG', name: 'Сингапур', continent: 'asia', available: true },
    { code: 'JP', name: 'Япония', continent: 'asia', available: true },
    { code: 'TR', name: 'Турция', continent: 'asia', available: true },
    { code: 'AE', name: 'ОАЭ', continent: 'asia', available: true },
    { code: 'KR', name: 'Южная Корея', continent: 'asia', available: true },
    { code: 'HK', name: 'Гонконг', continent: 'asia', available: true },
  ],
};

export const dedicatedServersApi = {
  // GET /cabinet/dedicated-servers/config
  getConfig: async (): Promise<DedicatedServersConfigResponse> => {
    try {
      const response = await apiClient.get<DedicatedServersConfigResponse>(
        '/cabinet/dedicated-servers/config',
      );
      const data = response.data;
      return {
        base_price_rubles: data?.base_price_rubles ?? DEFAULT_DEDICATED_CONFIG.base_price_rubles,
        marketing: {
          headline: data?.marketing?.headline || DEFAULT_DEDICATED_CONFIG.marketing?.headline || '',
          benefits: data?.marketing?.benefits?.length
            ? data.marketing.benefits
            : DEFAULT_DEDICATED_CONFIG.marketing?.benefits || [],
        },
        periods:
          data?.periods && data.periods.length > 0
            ? data.periods
            : DEFAULT_DEDICATED_CONFIG.periods,
        options: {
          ai_access: {
            ...(DEFAULT_DEDICATED_CONFIG.options.ai_access || {
              id: 'ai_access',
              name: 'AI Access',
              description: '',
            }),
            ...data?.options?.ai_access,
          },
          youtube_no_ads: {
            ...(DEFAULT_DEDICATED_CONFIG.options.youtube_no_ads || {
              id: 'youtube_no_ads',
              name: 'YouTube No Ads',
              description: '',
            }),
            ...data?.options?.youtube_no_ads,
          },
        },
        countries:
          data?.countries && data.countries.length > 0
            ? data.countries
            : DEFAULT_DEDICATED_CONFIG.countries,
      };
    } catch {
      return DEFAULT_DEDICATED_CONFIG;
    }
  },

  // GET /cabinet/dedicated-servers/my
  getMyServers: async (): Promise<DedicatedServerOrder[]> => {
    try {
      const response = await apiClient.get<
        | DedicatedServerOrder[]
        | { servers?: DedicatedServerOrder[]; orders?: DedicatedServerOrder[] }
      >('/cabinet/dedicated-servers/my');
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object') {
        if (Array.isArray(data.servers)) return data.servers;
        if (Array.isArray(data.orders)) return data.orders;
      }
      return [];
    } catch {
      // If endpoint doesn't exist yet, return empty list
      return [];
    }
  },

  // POST /cabinet/dedicated-servers/order
  createOrder: async (
    data: CreateDedicatedOrderRequest,
  ): Promise<{ id: number; message?: string }> => {
    const response = await apiClient.post<{ id: number; message?: string }>(
      '/cabinet/dedicated-servers/order',
      data,
    );
    return response.data;
  },

  // GET /cabinet/admin/servers/dedicated?status=pending
  getAdminOrders: async (status?: string): Promise<DedicatedServerOrder[]> => {
    const params = status && status !== 'all' ? { status } : {};
    const response = await apiClient.get<
      | DedicatedServerOrder[]
      | {
          orders?: DedicatedServerOrder[];
          servers?: DedicatedServerOrder[];
          items?: DedicatedServerOrder[];
        }
    >('/cabinet/admin/servers/dedicated', { params });
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object') {
      if (Array.isArray(data.orders)) return data.orders;
      if (Array.isArray(data.servers)) return data.servers;
      if (Array.isArray(data.items)) return data.items;
    }
    return [];
  },

  // POST /cabinet/admin/servers/dedicated/{order_id}/assign
  assignOrder: async (
    orderId: number,
    data: AssignDedicatedOrderRequest,
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post<{ success: boolean; message?: string }>(
      `/cabinet/admin/servers/dedicated/${orderId}/assign`,
      data,
    );
    return response.data;
  },

  // POST /cabinet/admin/servers/dedicated/{order_id}/reject
  rejectOrder: async (
    orderId: number,
    data: RejectDedicatedOrderRequest,
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post<{ success: boolean; message?: string }>(
      `/cabinet/admin/servers/dedicated/${orderId}/reject`,
      data,
    );
    return response.data;
  },
};
