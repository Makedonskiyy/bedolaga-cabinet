import { apiClient } from './client';

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

export const halloweenApi = {
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
};
