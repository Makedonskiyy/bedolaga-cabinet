import { Link } from 'react-router';

export function DiscountPromoBanner() {
  return (
    <Link
      to="/subscription/purchase"
      className="group relative block w-full overflow-hidden rounded-[26px] sm:rounded-[36px] md:rounded-[44px] lg:rounded-[50px] transition-all duration-300 hover:scale-[1.005] active:scale-[0.995]"
      style={{
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 88, 57, 1) 100%)',
        border: '3px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 24px -2px rgba(0, 88, 57, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="relative flex h-[140px] xs:h-[150px] sm:h-[160px] md:h-[170px] lg:h-[175px] xl:h-[185px] w-full items-center px-5 sm:px-8 md:px-10 lg:px-12">
        {/* Text container */}
        <div className="relative z-10 max-w-[62%] sm:max-w-[58%] md:max-w-[520px]">
          <h2
            className="text-left font-bold text-white tracking-tight leading-[1.1] text-[19px] xs:text-[22px] sm:text-[28px] md:text-[34px] lg:text-[38px] xl:text-[42px]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro", "Inter Display Pro", "Inter", sans-serif',
            }}
          >
            <span className="block whitespace-nowrap">Получи скидку</span>
            <span className="mt-1 block whitespace-nowrap">
              <span
                className="inline-block rounded-[3px] px-1 sm:px-1.5 md:px-2 py-0.5 text-white"
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

        {/* Coin element (x: 530, y: -32 at 580x324 in 1000x200 banner) */}
        <div
          className="pointer-events-none absolute bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105 left-[48%] xs:left-[50%] sm:left-[52%] lg:left-[53%] top-[-16px] xs:top-[-20px] sm:top-[-26px] md:top-[-28px] lg:top-[-30px] xl:top-[-32px] w-[320px] xs:w-[360px] sm:w-[460px] md:w-[500px] lg:w-[540px] xl:w-[580px] h-[179px] xs:h-[201px] sm:h-[257px] md:h-[279px] lg:h-[301px] xl:h-[324px]"
          style={{
            backgroundImage: 'url("/images/v16_6.png")',
          }}
        />
      </div>
    </Link>
  );
}

export default DiscountPromoBanner;
