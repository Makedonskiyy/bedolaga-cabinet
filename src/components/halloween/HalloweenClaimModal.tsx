import { useState } from 'react';
import { XIcon } from '@/components/icons';
import { halloweenApi, type HalloweenStateResponse } from '@/api/halloween';

interface HalloweenClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: HalloweenStateResponse;
  onStateUpdate: (newState: HalloweenStateResponse) => void;
}

const REWARD_OPTIONS = [
  { days: 1, minutes: 1440, label: '1 день VPN' },
  { days: 3, minutes: 4320, label: '3 дня VPN' },
  { days: 7, minutes: 10080, label: '7 дней VPN' },
  { days: 14, minutes: 20160, label: '14 дней VPN (Максимум)' },
];

export function HalloweenClaimModal({
  isOpen,
  onClose,
  state,
  onStateUpdate,
}: HalloweenClaimModalProps) {
  const [selectedDays, setSelectedDays] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const remainingDaysAllowed = Math.max(0, state.max_claimable_days - state.claimed_days);

  const handleClaim = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await halloweenApi.claimReward(selectedDays);
      setSuccessMsg(res.message);
      onStateUpdate(res.state);
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setErrorMsg(
        anyErr.response?.data?.detail || anyErr.message || 'Ошибка при получении награды',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-white/10 bg-neutral-950/90 p-6 sm:p-8 backdrop-blur-2xl">
        {/* Закрыть */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
        >
          <XIcon className="h-5 w-5" />
        </button>

        <div className="mb-5 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Обмен на дни VPN</h2>
          <p className="mt-1.5 text-sm text-white/60">
            Доступно к обмену:{' '}
            <span className="font-bold text-orange-400">{state.available_minutes} минут</span>
          </p>
          <p className="text-xs text-white/40">
            Получено за ивент: {state.claimed_days} из {state.max_claimable_days} дн.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-xs text-emerald-400">
            {successMsg}
          </div>
        )}

        <div className="mb-6 space-y-2.5">
          {REWARD_OPTIONS.map((opt) => {
            const canAfford = state.available_minutes >= opt.minutes;
            const fitsLimit = opt.days <= remainingDaysAllowed;
            const isAvailable = canAfford && fitsLimit;

            return (
              <button
                key={opt.days}
                onClick={() => setSelectedDays(opt.days)}
                disabled={!isAvailable}
                className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                  selectedDays === opt.days
                    ? 'border-orange-500/60 bg-orange-500/15 text-orange-400'
                    : 'border-white/10 bg-neutral-900/60 text-white/80'
                } ${!isAvailable ? 'cursor-not-allowed opacity-40' : 'hover:border-white/20'}`}
              >
                <div>
                  <div className="font-bold text-base text-white">{opt.label}</div>
                  <div className="text-xs text-white/50">{opt.minutes.toLocaleString()} минут</div>
                </div>
                <div className="text-xs font-semibold">
                  {!fitsLimit ? (
                    <span className="text-white/40">Лимит исчерпан</span>
                  ) : !canAfford ? (
                    <span className="text-red-400">Не хватает минут</span>
                  ) : (
                    <span className="text-orange-400">Доступно</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleClaim}
          disabled={isLoading || remainingDaysAllowed <= 0}
          className="w-full rounded-full bg-orange-500 py-3.5 px-8 text-base font-bold text-orange-950 transition hover:bg-orange-400 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'Активируем...' : `Активировать +${selectedDays} дн. VPN`}
        </button>
      </div>
    </div>
  );
}
