import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { XIcon } from '@/components/icons';

const BANNER_STORAGE_KEY = 'halloween_banner_dismissed_until';

export function HalloweenBannerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Не показывать баннер, если пользователь уже на странице ивента
    if (location.pathname === '/halloween') {
      return;
    }

    // Проверяем, не был ли баннер закрыт ранее (показываем раз в 12 часов)
    const dismissedUntil = localStorage.getItem(BANNER_STORAGE_KEY);
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      return;
    }

    // Небольшая задержка перед показом для плавности
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Слушатель для принудительного открытия баннера из админки (кнопка предпросмотра)
  useEffect(() => {
    const handleForceOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-halloween-banner', handleForceOpen);
    return () => window.removeEventListener('open-halloween-banner', handleForceOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Запоминаем закрытие на 12 часов
    localStorage.setItem(BANNER_STORAGE_KEY, String(Date.now() + 12 * 3600 * 1000));
  };

  const handleGoToEvent = () => {
    handleClose();
    navigate('/halloween');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-orange-500/40 bg-zinc-950 shadow-[0_0_50px_rgba(249,115,22,0.3)]">
        {/* Кнопка закрыть */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-zinc-300 backdrop-blur-md transition-colors hover:bg-black/90 hover:text-white"
          aria-label="Закрыть"
        >
          <XIcon className="h-5 w-5" />
        </button>

        {/* Изображение баннера */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-900">
          <img
            src="/halloween/banner.png"
            alt="Halloween Event"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        </div>

        {/* Описание и призыв */}
        <div className="flex flex-col p-6 text-center">
          <h2 className="mb-2 text-2xl font-black text-orange-400">
            🎃 Хэллоуинский ивент Triton VPN!
          </h2>
          <p className="mb-5 text-sm text-zinc-300">
            Тапай тыкву, прокачивай уровень и выбивай бесплатный VPN до 14 дней, промокоды и бусты в
            мини-игре «Сладость или гадость»!
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleGoToEvent}
              className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-orange-500/30 transition-transform active:scale-98"
            >
              🚀 Перейти к ивенту
            </button>
            <button
              onClick={handleClose}
              className="w-full py-2 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Позже
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
