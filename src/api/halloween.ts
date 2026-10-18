import { apiClient } from './client';

export interface HalloweenConfigResponse {
  is_enabled: boolean;
  is_admin: boolean;
  can_access: boolean;
  remaining_seconds: number;
}

export interface HalloweenStateResponse {
  user_id: number;
  earned_minutes: number;
  available_minutes: number;
  level: number;
  level_name: string;
  profit_per_tap: number;
  base_profit_per_tap: number;
  passive_per_hour: number;
  base_passive_per_hour: number;
  upgrade_cost: number | null;
  energy: number;
  max_energy: number;
  is_boosted: boolean;
  boost_remaining_seconds: number;
  is_cursed: boolean;
  cursed_frozen_minutes: number;
  trick_or_treat_cooldown_seconds: number;
  can_play_trick_or_treat: boolean;
  claimed_days: number;
  max_claimable_days: number;
  event_remaining_seconds: number;
  passive_collected_just_now?: number;
}

export interface TrickOrTreatResultResponse {
  is_treat: boolean;
  chosen_pumpkin: number;
  reward_type: 'minutes' | 'boost' | 'promo' | 'curse';
  reward_title: string;
  reward_value?: string | number;
  frozen_minutes?: number;
  state: HalloweenStateResponse;
}

export interface ClaimRewardResponse {
  success: boolean;
  days_added: number;
  claimed_total: number;
  message: string;
  state: HalloweenStateResponse;
}

export interface UncurseResponse {
  success: boolean;
  message: string;
  state: HalloweenStateResponse;
}

export interface HalloweenAdminStatsResponse {
  is_enabled: boolean;
  total_players: number;
  total_earned_minutes: number;
  total_available_minutes: number;
  total_claimed_days: number;
  total_games: number;
  total_treats: number;
  total_tricks: number;
  treat_percentage: number;
  trick_percentage: number;
  today_games: number;
  today_treats: number;
  today_tricks: number;
  today_treat_percentage: number;
  today_trick_percentage: number;
  today_claims_days: number;
  today_claims_count: number;
  today_new_players: number;
  level_distribution?: Record<number, number>;
  rewards_breakdown: Array<{
    reward_type: string;
    count: number;
    total_value: number;
  }>;
  top_players: Array<{
    user_id: number;
    name: string;
    earned_minutes: number;
    available_minutes?: number;
    level: number;
    claimed_days: number;
  }>;
  recent_games: Array<{
    id: number;
    user_id: number;
    user_name: string;
    is_treat: boolean;
    chosen_pumpkin: number;
    reward_type: string;
    reward_title: string;
    reward_value: number;
    created_at: string | null;
  }>;
}

async function getWithFallback<T>(cabinetPath: string, legacyPath: string): Promise<T> {
  try {
    const res = await apiClient.get<T>(cabinetPath);
    return res.data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      const res = await apiClient.get<T>(legacyPath);
      return res.data;
    }
    throw err;
  }
}

async function postWithFallback<T>(
  cabinetPath: string,
  legacyPath: string,
  data?: unknown,
): Promise<T> {
  try {
    const res = await apiClient.post<T>(cabinetPath, data);
    return res.data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      const res = await apiClient.post<T>(legacyPath, data);
      return res.data;
    }
    throw err;
  }
}

export const halloweenApi = {
  getConfig: async (): Promise<HalloweenConfigResponse> => {
    return getWithFallback<HalloweenConfigResponse>(
      '/cabinet/halloween/config',
      '/halloween/config',
    );
  },

  getState: async (): Promise<HalloweenStateResponse> => {
    return getWithFallback<HalloweenStateResponse>('/cabinet/halloween/state', '/halloween/state');
  },

  tap: async (count: number): Promise<HalloweenStateResponse> => {
    return postWithFallback<HalloweenStateResponse>('/cabinet/halloween/tap', '/halloween/tap', {
      count,
    });
  },

  upgrade: async (): Promise<HalloweenStateResponse> => {
    return postWithFallback<HalloweenStateResponse>(
      '/cabinet/halloween/upgrade',
      '/halloween/upgrade',
    );
  },

  playTrickOrTreat: async (chosen_pumpkin: number): Promise<TrickOrTreatResultResponse> => {
    return postWithFallback<TrickOrTreatResultResponse>(
      '/cabinet/halloween/trick-or-treat',
      '/halloween/trick-or-treat',
      { chosen_pumpkin },
    );
  },

  uncurse: async (): Promise<UncurseResponse> => {
    return postWithFallback<UncurseResponse>('/cabinet/halloween/uncurse', '/halloween/uncurse');
  },

  claimReward: async (days: number): Promise<ClaimRewardResponse> => {
    return postWithFallback<ClaimRewardResponse>('/cabinet/halloween/claim', '/halloween/claim', {
      days,
    });
  },

  getAdminStats: async (): Promise<HalloweenAdminStatsResponse> => {
    return getWithFallback<HalloweenAdminStatsResponse>(
      '/cabinet/halloween/admin/stats',
      '/halloween/admin/stats',
    );
  },

  toggleEvent: async (
    enabled: boolean,
  ): Promise<{ success: boolean; is_enabled: boolean; message: string }> => {
    return postWithFallback<{
      success: boolean;
      is_enabled: boolean;
      message: string;
    }>('/cabinet/halloween/admin/toggle', '/halloween/admin/toggle', { enabled });
  },

  sendAdminReport: async (): Promise<{ success: boolean; message: string }> => {
    return postWithFallback<{ success: boolean; message: string }>(
      '/cabinet/halloween/admin/send-report',
      '/halloween/admin/send-report',
    );
  },
};
