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
  { days: 14, minutes: 20160, label: '14 дней VPN (Макс)' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-orange-500/40 bg-zinc-950 p-6 shadow-[0_0_50px_rgba(249,115,22,0.3)]">
        {/* Закрыть */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
        >
          <XIcon className="h-5 w-5" />
        </button>

        <div className="mb-4 text-center">
          <div className="mb-2 text-5xl">🎁</div>
          <h2 className="text-2xl font-black text-white">Обмен на дни VPN</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Доступно к обмену:{' '}
            <span className="font-bold text-orange-400">{state.available_minutes} минут</span>
          </p>
          <p className="text-2xs text-zinc-500">
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

        <div className="mb-5 space-y-2.5">
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
                    ? 'border-orange-500 bg-orange-500/15 text-orange-400 shadow-md'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-300'
                } ${!isAvailable ? 'cursor-not-allowed opacity-40' : 'hover:border-zinc-700'}`}
              >
                <div>
                  <div className="font-bold text-sm text-white">{opt.label}</div>
                  <div className="text-xs text-zinc-400">{opt.minutes.toLocaleString()} минут</div>
                </div>
                <div className="text-xs font-semibold">
                  {!fitsLimit ? (
                    <span className="text-zinc-500">Лимит исчерпан</span>
                  ) : !canAfford ? (
                    <span className="text-red-400">Не хватает минут</span>
                  ) : (
                    <span className="text-emerald-400">Доступно</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleClaim}
          disabled={isLoading || remainingDaysAllowed <= 0}
          className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-orange-500/30 transition-transform active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'Активируем подписку...' : `Активировать +${selectedDays} дн. VPN`}
        </button>
      </div>
    </div>
  );
}
