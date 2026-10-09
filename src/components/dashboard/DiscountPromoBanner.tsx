import { Link } from 'react-router';

export function DiscountPromoBanner() {
  return (
    <Link
      to="/subscription/purchase"
      className="group relative block w-full overflow-hidden rounded-[28px] sm:rounded-[36px] md:rounded-[50px] shadow-md transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/40 hover:scale-[1.005] active:scale-[0.995]"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,88,57,1) 100%)',
      }}
    >
      <div className="relative flex min-h-[140px] sm:min-h-[170px] md:min-h-[200px] w-full items-center justify-between px-6 py-6 sm:px-10 sm:py-8 md:px-12">
        {/* Text container */}
        <div className="relative z-10 max-w-[70%] sm:max-w-[58%] md:max-w-[460px]">
          <h2
            className="text-left font-bold text-white tracking-tight leading-[1.1] text-[21px] xs:text-[24px] sm:text-[34px] md:text-[42px] lg:text-[48px] xl:text-[50px]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro", "Inter Display Pro", "Inter", sans-serif',
            }}
          >
            <span className="block">Получи скидку</span>
            <span className="mt-1 block">
              <span
                className="inline-block rounded-[3px] px-1 sm:px-2 py-0.5 text-white"
                style={{
                  backgroundColor: 'rgba(0, 255, 165, 0.23)',
                }}
              >
                30%
              </span>{' '}
              на все услуги
            </span>
          </h2>
        </div>

        {/* Coins image on the right */}
        <div
          className="pointer-events-none absolute right-[-20px] sm:right-[-10px] md:right-[0px] lg:right-[20px] top-1/2 -translate-y-1/2 w-[210px] xs:w-[240px] sm:w-[360px] md:w-[480px] lg:w-[580px] h-[140px] sm:h-[220px] md:h-[280px] lg:h-[324px] bg-center bg-no-repeat bg-contain transition-transform duration-500 group-hover:scale-105"
          style={{
            backgroundImage: 'url("/images/v16_6.png")',
          }}
        />
      </div>
    </Link>
  );
}

export default DiscountPromoBanner;
