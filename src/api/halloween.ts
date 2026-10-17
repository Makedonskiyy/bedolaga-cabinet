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

export const halloweenApi = {
  getConfig: async (): Promise<HalloweenConfigResponse> => {
    const response = await apiClient.get<HalloweenConfigResponse>('/halloween/config');
    return response.data;
  },

  getState: async (): Promise<HalloweenStateResponse> => {
    const response = await apiClient.get<HalloweenStateResponse>('/halloween/state');
    return response.data;
  },

  tap: async (count: number): Promise<HalloweenStateResponse> => {
    const response = await apiClient.post<HalloweenStateResponse>('/halloween/tap', { count });
    return response.data;
  },

  upgrade: async (): Promise<HalloweenStateResponse> => {
    const response = await apiClient.post<HalloweenStateResponse>('/halloween/upgrade');
    return response.data;
  },

  playTrickOrTreat: async (chosen_pumpkin: number): Promise<TrickOrTreatResultResponse> => {
    const response = await apiClient.post<TrickOrTreatResultResponse>('/halloween/trick-or-treat', {
      chosen_pumpkin,
    });
    return response.data;
  },

  uncurse: async (): Promise<UncurseResponse> => {
    const response = await apiClient.post<UncurseResponse>('/halloween/uncurse');
    return response.data;
  },

  claimReward: async (days: number): Promise<ClaimRewardResponse> => {
    const response = await apiClient.post<ClaimRewardResponse>('/halloween/claim', { days });
    return response.data;
  },

  getAdminStats: async (): Promise<HalloweenAdminStatsResponse> => {
    const response = await apiClient.get<HalloweenAdminStatsResponse>('/halloween/admin/stats');
    return response.data;
  },

  toggleEvent: async (
    enabled: boolean,
  ): Promise<{ success: boolean; is_enabled: boolean; message: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      is_enabled: boolean;
      message: string;
    }>('/halloween/admin/toggle', { enabled });
    return response.data;
  },

  sendAdminReport: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/halloween/admin/send-report',
    );
    return response.data;
  },
};
