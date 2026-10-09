import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PiMicrophoneFill, PiPaperPlaneRightFill, PiTrash } from 'react-icons/pi';
import { useNotify } from '@/platform/hooks/useNotify';
import { cn } from '@/lib/utils';

export interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob) => Promise<void> | void;
  onError?: (errorMessage: string) => void;
  disabled?: boolean;
  className?: string;
}

function getAudioMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/ogg; codecs=opus',
    'audio/ogg',
    'audio/webm; codecs=opus',
    'audio/webm',
    'audio/mp4',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function VoiceRecorder({
  onSendVoice,
  onError,
  disabled = false,
  className,
}: VoiceRecorderProps) {
  const { t } = useTranslation();
  const notify = useNotify();
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancelledRef = useRef(false);
  const secondsRef = useRef(0);

  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  // Clean up any ongoing stream or timer when unmounting
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  const handleCancel = useCallback(() => {
    isCancelledRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
    }
    setIsRecording(false);
    setSeconds(0);
    secondsRef.current = 0;
  }, []);

  const handleStopAndSend = useCallback(() => {
    if (secondsRef.current < 5) {
      notify.warning(
        t('support.voiceMinDuration', 'Голосовое сообщение должно длиться не менее 5 секунд'),
      );
      handleCancel();
      return;
    }
    isCancelledRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, [handleCancel, notify, t]);

  const startRecording = async () => {
    if (disabled || isSending || isRecording) return;
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      onError?.(t('support.voiceNotSupported', 'Запись голоса не поддерживается в этом браузере'));
      return;
    }

    try {
      isCancelledRef.current = false;
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getAudioMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => {
            track.stop();
          });
          streamRef.current = null;
        }

        if (isCancelledRef.current || secondsRef.current < 5) {
          setIsRecording(false);
          setSeconds(0);
          secondsRef.current = 0;
          return;
        }

        const type = mimeType || mediaRecorder.mimeType || 'audio/ogg';
        const audioBlob = new Blob(audioChunksRef.current, { type });
        audioChunksRef.current = [];
        setIsRecording(false);
        setSeconds(0);
        secondsRef.current = 0;

        if (audioBlob.size > 0) {
          try {
            setIsSending(true);
            await onSendVoice(audioBlob);
          } catch {
            // Error handling is managed by onSendVoice or onError
          } finally {
            setIsSending(false);
          }
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          // Cap recording at 5 minutes (300 seconds)
          if (prev >= 300) {
            handleStopAndSend();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
      ) {
        onError?.(
          t('support.voicePermissionDenied', 'Доступ к микрофону запрещен в настройках браузера'),
        );
      } else {
        onError?.(t('support.voiceRecordError', 'Не удалось получить доступ к микрофону'));
      }
    }
  };

  if (isSending) {
    return (
      <div className="inline-flex items-center gap-2.5 rounded-xl border border-accent-500/30 bg-accent-500/10 px-3.5 py-2 text-xs font-medium text-accent-300 backdrop-blur-xl">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        <span>{t('support.sendingVoice', 'Отправка...')}</span>
      </div>
    );
  }

  if (isRecording) {
    const isMinMet = seconds >= 5;
    const remainingToMin = Math.max(0, 5 - seconds);

    return (
      <div className="inline-flex items-center gap-2.5 rounded-2xl border border-red-500/30 bg-red-950/25 px-3 py-1.5 text-sm backdrop-blur-2xl shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-in fade-in zoom-in-95 duration-200">
        {/* Pulsing Recording Dot */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
          </span>

          {/* Live Timer */}
          <span className="font-mono text-xs font-bold text-red-400 min-w-[38px] tracking-wider">
            {formatSeconds(seconds)}
          </span>
        </div>

        {/* Animated Waveform Visualizer */}
        <div className="hidden items-center gap-1 h-4 px-1 sm:flex" aria-hidden="true">
          {[5, 14, 9, 16, 7, 15, 11, 17, 8, 13, 10].map((h, i) => (
            <span
              key={i}
              className="w-[2px] rounded-full bg-gradient-to-t from-red-500 to-red-300 animate-pulse"
              style={{
                height: `${h}px`,
                animationDuration: `${0.45 + (i % 3) * 0.2}s`,
                animationDelay: `${i * 0.07}s`,
              }}
            />
          ))}
        </div>

        {/* Min 5s Countdown Badge if under 5 seconds */}
        {!isMinMet && (
          <span className="hidden rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:inline-flex">
            ещё {remainingToMin}с
          </span>
        )}

        <div className="flex items-center gap-1.5 ml-0.5">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={handleCancel}
            title={t('common.cancel', 'Отменить')}
            className="flex h-7 w-7 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-white/10 hover:text-red-400 active:scale-95"
          >
            <PiTrash className="h-4 w-4" />
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleStopAndSend}
            title={
              isMinMet
                ? t('support.sendVoice', 'Отправить')
                : t(
                    'support.voiceMinDuration',
                    'Голосовое сообщение должно длиться не менее 5 секунд',
                  )
            }
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 active:scale-95',
              isMinMet
                ? 'bg-accent-500 text-black shadow-md hover:bg-accent-400 hover:scale-105'
                : 'bg-white/10 text-zinc-400 hover:bg-white/15 hover:text-zinc-200',
            )}
          >
            <PiPaperPlaneRightFill className="h-3.5 w-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      title={t('support.recordVoice', 'Голосовое сообщение')}
      className={cn(
        'group inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-xl transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07] hover:text-white active:scale-95 disabled:opacity-50',
        className,
      )}
    >
      <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400 group-hover:bg-accent-500/25 group-hover:scale-110 transition-all">
        <PiMicrophoneFill className="h-3.5 w-3.5" />
      </div>
      <span className="font-medium tracking-wide">
        {t('support.recordVoice', 'Голосовое сообщение')}
      </span>
    </button>
  );
}
