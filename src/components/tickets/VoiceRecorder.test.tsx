// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { VoiceRecorder } from './VoiceRecorder';
import { MessageMediaGrid } from './MessageMediaGrid';

const mockNotifyWarning = vi.fn();
vi.mock('@/platform/hooks/useNotify', () => ({
  useNotify: () => ({
    warning: mockNotifyWarning,
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key),
    i18n: { language: 'ru', changeLanguage: () => Promise.resolve() },
  }),
}));

describe('VoiceRecorder', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('рендерит кнопку записи с иконкой микрофона', () => {
    render(<VoiceRecorder onSendVoice={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).not.toBeNull();
    expect(button.textContent).toContain('Голосовое сообщение');
  });

  it('запрашивает доступ к микрофону при нажатии', async () => {
    const mockTrack = { stop: vi.fn() };
    const mockStream = {
      getTracks: () => [mockTrack],
    };
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });

    class MockMediaRecorder {
      static isTypeSupported = vi.fn().mockReturnValue(true);
      state = 'inactive';
      mimeType = 'audio/ogg; codecs=opus';
      ondataavailable = vi.fn();
      onstop = vi.fn();
      start = vi.fn(() => {
        this.state = 'recording';
      });
      stop = vi.fn(() => {
        this.state = 'inactive';
        if (this.onstop) this.onstop(new Event('stop'));
      });
    }

    (window as unknown as { MediaRecorder: typeof MockMediaRecorder }).MediaRecorder =
      MockMediaRecorder;

    render(<VoiceRecorder onSendVoice={vi.fn()} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    });
  });

  it('показывает предупреждение и не отправляет, если запись длилась менее 5 секунд', async () => {
    const onSendVoice = vi.fn();
    const mockTrack = { stop: vi.fn() };
    const mockStream = { getTracks: () => [mockTrack] };
    const getUserMedia = vi.fn().mockResolvedValue(mockStream);

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });

    class MockMediaRecorder {
      static isTypeSupported = vi.fn().mockReturnValue(true);
      state = 'inactive';
      mimeType = 'audio/ogg; codecs=opus';
      ondataavailable = vi.fn();
      onstop = vi.fn();
      start = vi.fn(() => {
        this.state = 'recording';
      });
      stop = vi.fn(() => {
        this.state = 'inactive';
        if (this.onstop) this.onstop(new Event('stop'));
      });
    }

    (window as unknown as { MediaRecorder: typeof MockMediaRecorder }).MediaRecorder =
      MockMediaRecorder;

    render(<VoiceRecorder onSendVoice={onSendVoice} />);
    const startButton = screen.getByRole('button');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByTitle('Отменить')).not.toBeNull();
    });

    const sendButton = screen.getByTitle('Голосовое сообщение должно длиться не менее 5 секунд');
    fireEvent.click(sendButton);

    expect(mockNotifyWarning).toHaveBeenCalledWith(
      'Голосовое сообщение должно длиться не менее 5 секунд',
    );
    expect(onSendVoice).not.toHaveBeenCalled();
  });
});

describe('MessageMediaGrid с голосовым сообщением', () => {
  afterEach(() => {
    cleanup();
  });

  it('рендерит тег audio с классом voice-message и controls', () => {
    const message = {
      has_media: true,
      media_type: 'voice',
      media_file_id: 'voice_abc_123',
      media_token: 'tok_xyz',
    };

    const { container } = render(<MessageMediaGrid message={message} />);
    const voiceContainer = container.querySelector('.voice-message');
    expect(voiceContainer).not.toBeNull();

    const audio = container.querySelector('audio');
    expect(audio).not.toBeNull();
    expect(audio?.hasAttribute('controls')).toBe(true);
    expect(audio?.getAttribute('src')).toContain('voice_abc_123');
    expect(audio?.getAttribute('src')).toContain('token=tok_xyz');
  });
});
