import { Link } from 'react-router';

export function HalloweenPromoBanner() {
  return (
    <Link
      to="/halloween"
      className="group relative block w-full overflow-hidden rounded-[26px] sm:rounded-[36px] md:rounded-[44px] lg:rounded-[50px] transition-all duration-300 hover:scale-[1.005] active:scale-[0.995]"
      style={{
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(124, 45, 18, 1) 100%)',
        boxShadow: '0 4px 24px -2px rgba(249, 115, 22, 0.25)',
      }}
    >
      {/* Adaptive white outline overlay, matches DiscountPromoBanner */}
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] border-2 sm:border-[2.5px] lg:border-[3px] border-white/15" />

      <div className="relative flex h-[180px] xs:h-[190px] sm:h-[200px] md:h-[215px] lg:h-[230px] xl:h-[245px] w-full items-center px-5 sm:px-8 md:px-10 lg:px-12">
        {/* Text + CTA */}
        <div className="relative z-10 flex max-w-[68%] sm:max-w-[62%] md:max-w-[540px] flex-col items-start gap-3 sm:gap-3.5">
          <h2
            className="text-left font-bold text-white tracking-tight leading-[1.1] text-[23px] xs:text-[27px] sm:text-[33px] md:text-[39px] lg:text-[44px] xl:text-[48px]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro", "Inter Display Pro", "Inter", sans-serif',
            }}
          >
            <span className="block whitespace-nowrap">Хэллоуинский ивент</span>
            <span className="block whitespace-nowrap">начался</span>
          </h2>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="inline-flex items-center rounded-full bg-orange-500 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base font-bold text-orange-950 transition group-hover:bg-orange-400">
              Перейти
            </span>
            <span className="text-2xs xs:text-xs sm:text-sm text-white/50 whitespace-nowrap">
              до 3 ноября 23:59 (МСК)
            </span>
          </div>
        </div>

        {/* Pumpkin character — по центру высоты баннера, бóльшая часть всегда видна */}
        <img
          src="/halloween/pumpkin.png"
          alt=""
          className="pointer-events-none absolute right-[4%] top-1/2 -translate-y-1/2 object-contain transition-transform duration-500 group-hover:scale-105 h-[68%] xs:h-[72%] sm:h-[76%] aspect-square"
        />
      </div>
    </Link>
  );
}

export default HalloweenPromoBanner;
