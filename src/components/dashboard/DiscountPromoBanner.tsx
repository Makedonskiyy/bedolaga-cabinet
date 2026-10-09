import { Link } from 'react-router';

export function DiscountPromoBanner() {
  return (
    <Link
      to="/subscription/purchase"
      className="group relative block w-full overflow-hidden rounded-[28px] sm:rounded-[36px] md:rounded-[50px] transition-all duration-300 hover:scale-[1.005] active:scale-[0.995]"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,88,57,1) 100%)',
        border: '1px solid rgba(0, 255, 165, 0.35)',
        boxShadow: '0 4px 24px -2px rgba(0, 88, 57, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="relative flex h-[155px] xs:h-[165px] sm:h-[180px] md:h-[200px] w-full items-center px-5 sm:px-8 md:px-[47px]">
        {/* Text container */}
        <div className="relative z-10 max-w-[62%] sm:max-w-[58%] md:max-w-[440px]">
          <h2
            className="text-left font-bold text-white tracking-tight leading-[1.08] text-[20px] xs:text-[23px] sm:text-[32px] md:text-[42px] lg:text-[48px] xl:text-[50px]"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro", "Inter Display Pro", "Inter", sans-serif',
            }}
          >
            <span className="block">Получи скидку</span>
            <span className="mt-1 block">
              <span
                className="inline-block rounded-[3px] px-1 sm:px-1.5 md:px-2 py-0.5 text-white"
                style={{
                  backgroundColor: 'rgba(0, 255, 165, 0.23)',
                  border: '1px solid rgba(0, 255, 165, 0.4)',
                }}
              >
                30%
              </span>{' '}
              на все услуги
            </span>
          </h2>
        </div>

        {/* Coin element positioned according to Figma specs (top: 32px, left: 530px in 1000x200 banner) */}
        <div
          className="pointer-events-none absolute bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105 right-[-50px] xs:right-[-60px] sm:right-[-75px] md:right-[-90px] lg:right-[-110px] top-[14px] xs:top-[16px] sm:top-[22px] md:top-[26px] lg:top-[32px] w-[270px] xs:w-[310px] sm:w-[410px] md:w-[490px] lg:w-[580px] h-[151px] xs:h-[173px] sm:h-[229px] md:h-[274px] lg:h-[324px]"
          style={{
            backgroundImage: 'url("/images/v16_6.png")',
          }}
        />
      </div>
    </Link>
  );
}

export default DiscountPromoBanner;
