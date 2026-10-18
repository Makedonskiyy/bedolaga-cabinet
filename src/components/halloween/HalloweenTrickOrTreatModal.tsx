import { useState } from 'react';
import { XIcon } from '@/components/icons';
import { usePlatform } from '@/platform';
import {
  halloweenApi,
  type TrickOrTreatResultResponse,
  type HalloweenStateResponse,
} from '@/api/halloween';
import { BrokenGlassOverlay } from './BrokenGlassOverlay';

interface HalloweenTrickOrTreatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStateUpdate: (newState: HalloweenStateResponse) => void;
}

type Stage = 'intro' | 'picking' | 'treat' | 'trick';

export function HalloweenTrickOrTreatModal({
  isOpen,
  onClose,
  onStateUpdate,
}: HalloweenTrickOrTreatModalProps) {
  const { openTelegramLink } = usePlatform();
  const [stage, setStage] = useState<Stage>('intro');
  const [result, setResult] = useState<TrickOrTreatResultResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartPick = () => {
    setError(null);
    setStage('picking');
  };

  const handleSelectPumpkin = async (pumpkinIndex: number) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await halloweenApi.playTrickOrTreat(pumpkinIndex);
      setResult(res);
      onStateUpdate(res.state);

      if (res.is_treat) {
        setStage('treat');
      } else {
        setStage('trick');
      }
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(anyErr.response?.data?.detail || anyErr.message || 'Ошибка при открытии тыквы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareAndUncurse = async () => {
    setIsLoading(true);
    try {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
        'https://t.me/bot?startapp=halloween',
      )}&text=${encodeURIComponent(
        '🎃 Хэллоуин в Triton VPN! Заходи тапать тыкву и забирай до 14 дней бесплатного VPN!',
      )}`;

      openTelegramLink(shareUrl);

      const uncurseRes = await halloweenApi.uncurse();
      onStateUpdate(uncurseRes.state);
      onClose();
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(anyErr.response?.data?.detail || anyErr.message || 'Не удалось снять проклятие');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Если выпала гадость — полноэкранный экран заколдования строго по Figma */}
      {stage === 'trick' && (
        <BrokenGlassOverlay
          onShare={handleShareAndUncurse}
          frozenMinutes={result?.frozen_minutes}
          isLoading={isLoading}
        />
      )}

      {stage !== 'trick' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200 select-none">
          {/* Контейнер: Жидкое стекло (liquid glass) без свечения */}
          <div className="relative mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-white/10 bg-neutral-950/90 p-6 sm:p-8 backdrop-blur-2xl">
            {/* Кнопка закрыть */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
            >
              <XIcon className="h-5 w-5" />
            </button>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Stage 1: Intro (строго по Figma 1.tsx) */}
            {stage === 'intro' && (
              <div className="flex flex-col items-center text-center">
                <h2 className="mb-3 text-3xl sm:text-4xl font-bold text-white">
                  Сладость или гадость?
                </h2>
                <p className="mb-8 text-base sm:text-lg leading-relaxed text-white/80">
                  Испытай удачу Хэллоуина. Открой один из трёх котлов и узнай, что приготовила
                  нечисть!
                </p>
                <button
                  onClick={handleStartPick}
                  className="w-full max-w-xs rounded-full bg-orange-500 py-3.5 px-8 text-lg font-bold text-orange-950 transition hover:bg-orange-400 active:scale-95"
                >
                  Испытать удачу
                </button>
              </div>
            )}

            {/* Stage 2: Pick Pumpkin (строго по Figma 2.tsx) */}
            {stage === 'picking' && (
              <div className="flex flex-col items-center text-center">
                <h2 className="mb-2 text-3xl sm:text-4xl font-bold text-white">Выбери тыкву</h2>
                <p className="mb-8 text-base sm:text-lg text-white/80">Только аккуратнее!</p>

                <div className="mb-8 grid grid-cols-3 gap-3 w-full max-w-xs">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleSelectPumpkin(num)}
                      disabled={isLoading}
                      className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.08] active:scale-90 disabled:opacity-50"
                    >
                      <img
                        src="/halloween/evil-pumpkin.svg"
                        alt={`Тыква ${num}`}
                        className="h-16 w-16 object-contain"
                      />
                    </button>
                  ))}
                </div>

                {isLoading && (
                  <p className="animate-pulse text-sm text-orange-400">Открываем тыкву...</p>
                )}
              </div>
            )}

            {/* Stage 3: Treat / Тебе повезло (строго по Figma 3.tsx) */}
            {stage === 'treat' && (
              <div className="flex flex-col items-center text-center">
                <h2 className="mb-2 text-3xl sm:text-4xl font-bold text-white">Тебе повезло!</h2>
                <p className="mb-6 text-base sm:text-lg text-white/80">Варианты наград:</p>

                {/* Список в стиле макета с оранжевыми точками */}
                <div className="mb-8 flex flex-col gap-3.5 text-left w-full max-w-xs">
                  <div className="flex items-center gap-3">
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-orange-500" />
                    <span className="text-base sm:text-lg font-medium text-white">
                      +60 минут к твоему балансу
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-orange-500" />
                    <span className="text-base sm:text-lg font-medium text-white">
                      Буст дохода в тапалке x2 на 1 час
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-orange-500" />
                    <span className="text-base sm:text-lg font-medium text-white">
                      Промокод на скидку 25%
                    </span>
                  </div>
                </div>

                {/* Выпавшая конкретная награда */}
                {result?.reward_title && (
                  <div className="mb-6 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3 text-center text-sm font-bold text-orange-400 w-full max-w-xs">
                    Вы получили: {result.reward_title}
                    {result.reward_type === 'promo' && (
                      <div className="mt-1 font-mono text-xs text-white">{result.reward_value}</div>
                    )}
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="w-full max-w-xs rounded-full bg-orange-500 py-3.5 px-8 text-lg font-bold text-orange-950 transition hover:bg-orange-400 active:scale-95"
                >
                  Выбрать
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
