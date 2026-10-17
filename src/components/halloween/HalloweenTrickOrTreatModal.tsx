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
      // Открываем Telegram Share ссылку
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
        'https://t.me/bot?startapp=halloween',
      )}&text=${encodeURIComponent(
        '🎃 Хэллоуин в Triton VPN! Заходи тапать тыкву и забирай до 14 дней бесплатного VPN!',
      )}`;

      openTelegramLink(shareUrl);

      // Снимаем проклятие на сервере
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
      {/* Если выпала гадость — полноэкранный оверлей со скримером и трещинами */}
      {stage === 'trick' && (
        <BrokenGlassOverlay
          onShare={handleShareAndUncurse}
          frozenMinutes={result?.frozen_minutes}
          isLoading={isLoading}
        />
      )}

      {stage !== 'trick' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-orange-500/40 bg-zinc-950 p-6 shadow-[0_0_50px_rgba(249,115,22,0.3)]">
            {/* Закрыть */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <XIcon className="h-5 w-5" />
            </button>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-center text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Stage 1: Intro */}
            {stage === 'intro' && (
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 text-6xl">🎃</div>
                <h2 className="mb-3 text-3xl font-black text-white">Сладость или гадость?</h2>
                <p className="mb-8 text-sm leading-relaxed text-zinc-400">
                  Испытай удачу Хэллоуина. Открой один из трёх котлов и узнай, что приготовила
                  нечисть!
                </p>
                <button
                  onClick={handleStartPick}
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-orange-500/30 transition-transform active:scale-95"
                >
                  Испытать удачу
                </button>
              </div>
            )}

            {/* Stage 2: Pick Pumpkin */}
            {stage === 'picking' && (
              <div className="flex flex-col items-center text-center">
                <h2 className="mb-1 text-2xl font-black text-white">Выбери тыкву</h2>
                <p className="mb-6 text-sm text-zinc-400">Только аккуратнее! 👻</p>

                <div className="mb-8 grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleSelectPumpkin(num)}
                      disabled={isLoading}
                      className="group flex flex-col items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 transition-all hover:scale-105 hover:border-orange-500 hover:bg-orange-500/20 active:scale-95 disabled:opacity-50"
                    >
                      <img
                        src="/halloween/evil-pumpkin.svg"
                        alt={`Pumpkin ${num}`}
                        className="h-16 w-16 drop-shadow-md transition-transform group-hover:scale-110"
                      />
                      <span className="mt-2 text-xs font-semibold text-orange-400">№{num}</span>
                    </button>
                  ))}
                </div>

                {isLoading && (
                  <p className="animate-pulse text-xs text-orange-400">
                    Нечисть колдует над тыквой...
                  </p>
                )}
              </div>
            )}

            {/* Stage 3A: Treat (Победа) */}
            {stage === 'treat' && (
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 text-6xl">🍬</div>
                <h2 className="mb-1 text-2xl font-black text-emerald-400">Тебе повезло!</h2>
                <p className="mb-4 text-xs text-zinc-400">Тыква открылась без проклятия:</p>

                <div className="mb-6 w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="text-lg font-bold text-emerald-300">{result?.reward_title}</div>
                  {result?.reward_type === 'promo' && (
                    <div className="mt-2 select-all rounded-lg bg-zinc-900 px-3 py-1 font-mono text-xs text-orange-400">
                      {result.reward_value}
                    </div>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="w-full rounded-2xl bg-emerald-500 py-3.5 text-base font-bold text-zinc-950 transition-transform active:scale-95"
                >
                  Забрать награду
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
