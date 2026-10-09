import { Link } from 'react-router';

export function DiscountPromoBanner() {
  return (
    <Link
      to="/subscription/purchase"
      className="group relative block w-full overflow-hidden rounded-[26px] sm:rounded-[36px] md:rounded-[44px] lg:rounded-[50px] transition-all duration-300 hover:scale-[1.005] active:scale-[0.995]"
      style={{
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 88, 57, 1) 100%)',
        boxShadow: '0 4px 24px -2px rgba(0, 88, 57, 0.35)',
      }}
    >
      {/* Adaptive 15% white outline overlay (scales from 2px on mobile to 3px on desktop, sits above coin and background) */}
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] border-2 sm:border-[2.5px] lg:border-[3px] border-white/15" />

      <div className="relative flex h-[140px] xs:h-[148px] sm:h-[155px] md:h-[165px] lg:h-[175px] xl:h-[190px] w-full items-center px-5 sm:px-8 md:px-10 lg:px-12">
        {/* Text container */}
        <div className="relative z-10 max-w-[62%] sm:max-w-[58%] md:max-w-[500px]">
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

        {/* Coin element - adaptively scales from mobile to PC (x: 530, y: -32 at 580x324 in 1000x200 banner) */}
        <div
          className="pointer-events-none absolute bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105 left-[48%] xs:left-[49%] sm:left-[50%] md:left-[52%] lg:left-[53%] top-[-14px] xs:top-[-16px] sm:top-[-20px] md:top-[-24px] lg:top-[-28px] xl:top-[-32px] w-[300px] xs:w-[330px] sm:w-[380px] md:w-[440px] lg:w-[510px] xl:w-[580px] h-[168px] xs:h-[185px] sm:h-[212px] md:h-[246px] lg:h-[285px] xl:h-[324px]"
          style={{
            backgroundImage: 'url("/images/v16_6.png")',
          }}
        />
      </div>
    </Link>
  );
}

export default DiscountPromoBanner;
