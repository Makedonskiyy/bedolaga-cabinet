import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { PiPlayFill, PiPauseFill } from 'react-icons/pi';
import { cn } from '@/lib/utils';

export interface VoiceMessagePlayerProps {
  src: string;
  caption?: string | null;
  className?: string;
  fileId?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Deterministically generates pseudo-random waveform bar heights (percentage 15% - 100%)
 * from the audio src / fileId seed so the same voice message always looks identical.
 */
function generateWaveformBars(seedStr: string, count = 32): number[] {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash + seedStr.charCodeAt(i)) | 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    const pseudo = Math.abs(Math.sin(hash + i * 1.6180339887) * 10000);
    const normalized = pseudo - Math.floor(pseudo);
    // Scale between 20% and 100%
    bars.push(Math.round(20 + normalized * 80));
  }
  return bars;
}

const PLAYBACK_SPEEDS = [1, 1.5, 2] as const;

export function VoiceMessagePlayer({ src, caption, className, fileId }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [isHoveringWave, setIsHoveringWave] = useState(false);
  const [hoverFraction, setHoverFraction] = useState<number | null>(null);

  const currentSpeed = PLAYBACK_SPEEDS[speedIndex];
  const waveformBars = useMemo(
    () => generateWaveformBars(fileId || src || 'voice_sample', 34),
    [fileId, src],
  );

  // Sync playback speed with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = currentSpeed;
    }
  }, [currentSpeed]);

  // Pause when another audio starts playing globally
  useEffect(() => {
    const handleGlobalPlay = (e: Event) => {
      const customEvent = e as CustomEvent<{ target: HTMLAudioElement }>;
      if (customEvent.detail?.target && customEvent.detail.target !== audioRef.current) {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
      }
    };
    window.addEventListener('voice-message-playing', handleGlobalPlay);
    return () => {
      window.removeEventListener('voice-message-playing', handleGlobalPlay);
    };
  }, []);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onDurationChange = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
      window.dispatchEvent(new CustomEvent('voice-message-playing', { detail: { target: audio } }));
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        // Autoplay policy or aborted playback
      });
    }
  }, [isPlaying]);

  const handleWaveformClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const container = waveformRef.current;
      if (!audio || !container) return;

      const rect = container.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const fraction = clickX / rect.width;
      const targetDuration = duration || audio.duration || 0;

      if (targetDuration > 0) {
        audio.currentTime = fraction * targetDuration;
        setCurrentTime(audio.currentTime);
      }
    },
    [duration],
  );

  const handleWaveformMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = waveformRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setHoverFraction(clickX / rect.width);
  }, []);

  const toggleSpeed = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSpeedIndex((prev) => (prev + 1) % PLAYBACK_SPEEDS.length);
  }, []);

  // Compute current playback fraction (0 to 1)
  const currentFraction = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const activeFraction = isHoveringWave && hoverFraction !== null ? hoverFraction : currentFraction;

  return (
    <div className={cn('voice-message my-1.5 w-full max-w-sm sm:max-w-md select-none', className)}>
      {/* Hidden native audio tag preserving controls attribute for tests and accessibility */}
      <audio
        ref={audioRef}
        controls
        preload="metadata"
        src={src}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Styled Glassmorphic Voice Bubble */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-2.5 backdrop-blur-2xl shadow-sm transition-colors hover:border-white/15 sm:p-3">
        {/* Play / Pause Circular Button */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500 text-black shadow-md transition-all duration-200 hover:bg-accent-400 hover:scale-105 active:scale-95"
        >
          {isPlaying ? (
            <PiPauseFill className="h-5 w-5" />
          ) : (
            <PiPlayFill className="h-5 w-5 ml-0.5" />
          )}
        </button>

        {/* Waveform & Info Area */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          {/* Interactive Waveform Bars */}
          <div
            ref={waveformRef}
            onClick={handleWaveformClick}
            onMouseEnter={() => setIsHoveringWave(true)}
            onMouseLeave={() => {
              setIsHoveringWave(false);
              setHoverFraction(null);
            }}
            onMouseMove={handleWaveformMouseMove}
            className="flex h-6 w-full cursor-pointer items-center gap-[2.5px] py-1"
            title="Перемотать"
            role="slider"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            tabIndex={0}
            onKeyDown={(e) => {
              const audio = audioRef.current;
              if (!audio) return;
              if (e.key === 'ArrowRight') {
                audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
              } else if (e.key === 'ArrowLeft') {
                audio.currentTime = Math.max(0, audio.currentTime - 5);
              } else if (e.key === ' ' || e.key === 'Enter') {
                togglePlay();
              }
            }}
          >
            {waveformBars.map((heightPercent, idx) => {
              const barFraction = idx / (waveformBars.length - 1);
              const isFilled = barFraction <= activeFraction;

              return (
                <span
                  key={idx}
                  className={cn(
                    'w-[2.5px] rounded-full transition-all duration-100',
                    isFilled ? 'bg-accent-400' : 'bg-white/20 hover:bg-white/30',
                  )}
                  style={{
                    height: `${heightPercent}%`,
                  }}
                />
              );
            })}
          </div>

          {/* Bottom Row: Time and Speed */}
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>
              {isPlaying || currentTime > 0
                ? `${formatTime(currentTime)} / ${formatTime(duration)}`
                : formatTime(duration || 0)}
            </span>

            {/* Playback speed toggle */}
            <button
              type="button"
              onClick={toggleSpeed}
              title="Скорость воспроизведения"
              className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-bold text-zinc-300 transition-colors hover:bg-white/[0.1] hover:text-white active:scale-95"
            >
              {currentSpeed}x
            </button>
          </div>
        </div>
      </div>

      {caption && <p className="mt-1 text-xs text-zinc-400 px-1">{caption}</p>}
    </div>
  );
}
