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

    // Задержка перед показом для плавности
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
    <div className="fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden bg-zinc-950 animate-in fade-in duration-300 select-none">
      {/* Полноэкранный арт Хэллоуина */}
      <img
        src="/halloween.png"
        alt="Хэллоуинский ивент"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Мягкий градиент для читаемости текста внизу */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/20 pointer-events-none" />

      {/* Кнопка закрытия в правом верхнем углу (круглый жидкий бейдж) */}
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 sm:right-6 sm:top-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 transition-transform hover:bg-black/70 active:scale-90"
        aria-label="Закрыть"
      >
        <XIcon className="h-6 w-6" />
      </button>

      {/* Пустой распорочный верх */}
      <div className="relative z-10 w-full" />

      {/* Нижний блок с описанием и кнопкой строго по макету */}
      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center px-6 pb-10 sm:pb-14 text-center">
        <p className="mb-6 max-w-lg text-base sm:text-2xl font-medium leading-relaxed text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Тапай тыкву, прокачивай уровень и выбивай бесплатный VPN до 14 дней, промокоды и бусты в
          мини-игре «Сладость или гадость»!
        </p>

        <button
          onClick={handleGoToEvent}
          className="w-full max-w-xs sm:max-w-sm rounded-full bg-orange-500 py-4 px-8 text-center text-xl sm:text-2xl font-bold text-orange-950 transition-all hover:bg-orange-400 active:scale-95 shadow-lg shadow-black/40"
        >
          Перейти к ивенту
        </button>

        <button
          onClick={handleClose}
          className="mt-3 py-1.5 text-xs text-white/50 transition-colors hover:text-white"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
