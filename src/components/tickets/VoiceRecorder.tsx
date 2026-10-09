import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MicrophoneIcon, SendIcon, XIcon } from '@/components/icons';
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
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancelledRef = useRef(false);

  // Clean up any ongoing stream or timer when unmounting
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
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
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setSeconds(0);
  }, []);

  const handleStopAndSend = useCallback(() => {
    isCancelledRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

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
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (isCancelledRef.current) {
          setIsRecording(false);
          setSeconds(0);
          return;
        }

        const type = mimeType || mediaRecorder.mimeType || 'audio/ogg';
        const audioBlob = new Blob(audioChunksRef.current, { type });
        audioChunksRef.current = [];
        setIsRecording(false);
        setSeconds(0);

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
      <div className="flex items-center gap-2 text-xs text-dark-400">
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        <span>{t('support.sendingVoice', 'Отправка...')}</span>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dark-700/60 bg-dark-800/80 px-2.5 py-1 text-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error-500" />
        </span>
        <span className="font-mono text-xs font-semibold text-error-400">
          {formatSeconds(seconds)}
        </span>
        <button
          type="button"
          onClick={handleCancel}
          title={t('common.cancel', 'Отменить')}
          className="ml-1 rounded p-1 text-dark-400 transition-colors hover:text-dark-100 hover:bg-dark-700"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleStopAndSend}
          title={t('support.sendVoice', 'Отправить')}
          className="rounded p-1 text-accent-400 transition-colors hover:text-accent-300 hover:bg-dark-700"
        >
          <SendIcon className="h-3.5 w-3.5" />
        </button>
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
        'flex items-center gap-2 text-sm text-dark-400 transition-colors hover:text-dark-200 disabled:opacity-50',
        className,
      )}
    >
      <MicrophoneIcon className="h-4 w-4" />
      <span className="hidden sm:inline">{t('support.recordVoice', 'Голосовое сообщение')}</span>
    </button>
  );
}
