import type { CSSProperties } from 'react';
import {
  PiArrowLeft,
  PiArrowRight,
  PiArrowsClockwise,
  PiCaretDown,
  PiCaretRight,
  PiChartBar,
  PiChatCircle,
  PiCheck,
  PiClipboardText,
  PiClock,
  PiCopy,
  PiCreditCard,
  PiDiceFive,
  PiDownloadSimple,
  PiGameController,
  PiGearSix,
  PiGift,
  PiGlobe,
  PiHardDrives,
  PiHouse,
  PiInfo,
  PiList,
  PiLock,
  PiMagnifyingGlass,
  PiMegaphone,
  PiMicrophone,
  PiMoon,
  PiPalette,
  PiPauseCircle,
  PiPencil,
  PiPencilSimple,
  PiPlay,
  PiPlus,
  PiShield,
  PiShuffle,
  PiSignOut,
  PiSparkle,
  PiStar,
  PiStarFill,
  PiStop,
  PiSun,
  PiTrash,
  PiUploadSimple,
  PiUser,
  PiUsers,
  PiWallet,
  PiX,
} from 'react-icons/pi';

import { cn } from '@/lib/utils';

// Re-export the extended Phosphor icon sets so the whole cabinet imports the
// panel's icon family from a single barrel.
export * from './extended-icons';
export * from './editor-icons';

interface IconProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Cabinet icons are thin wrappers over the Remnawave panel's own icon library
 * (Phosphor, via `react-icons/pi`, regular weight). Each export keeps the
 * historical name + default Tailwind sizing so every consumer keeps working,
 * while the cabinet now renders the exact icon set the panel uses instead of
 * hand-written SVGs.
 *
 * react-icons components inherit `currentColor` and accept `className`, so
 * Tailwind size (`h-5 w-5`) and text-color utilities control them as before.
 */

// Navigation & Layout
export const HomeIcon = ({ className }: IconProps) => (
  <PiHouse className={cn('h-5 w-5', className)} />
);

export const BackIcon = ({ className }: IconProps) => (
  <PiArrowLeft className={cn('h-5 w-5', className)} />
);

export const ChevronRightIcon = ({ className }: IconProps) => (
  <PiCaretRight className={cn('h-5 w-5', className)} />
);

export const MenuIcon = ({ className }: IconProps) => (
  <PiList className={cn('h-5 w-5', className)} />
);

export const CloseIcon = ({ className }: IconProps) => <PiX className={cn('h-5 w-5', className)} />;

export const ChevronDownIcon = ({ className }: IconProps) => (
  <PiCaretDown className={cn('h-5 w-5', className)} />
);

export const ArrowRightIcon = ({ className }: IconProps) => (
  <PiArrowRight className={cn('h-5 w-5', className)} />
);

// Actions
export const SearchIcon = ({ className }: IconProps) => (
  <PiMagnifyingGlass className={cn('h-5 w-5', className)} />
);

export const PlusIcon = ({ className }: IconProps) => (
  <PiPlus className={cn('h-5 w-5', className)} />
);

export const EditIcon = ({ className }: IconProps) => (
  <PiPencilSimple className={cn('h-4 w-4', className)} />
);

export const PencilIcon = ({ className }: IconProps) => (
  <PiPencil className={cn('h-4 w-4', className)} />
);

export const TrashIcon = ({ className }: IconProps) => (
  <PiTrash className={cn('h-5 w-5', className)} />
);

export const MicrophoneIcon = ({ className }: IconProps) => (
  <PiMicrophone className={cn('h-5 w-5', className)} />
);

export const UploadIcon = ({ className }: IconProps) => (
  <PiUploadSimple className={cn('h-5 w-5', className)} />
);

export const DownloadIcon = ({ className }: IconProps) => (
  <PiDownloadSimple className={cn('h-5 w-5', className)} />
);

export const RefreshIcon = ({
  className,
  spinning = false,
}: IconProps & { spinning?: boolean }) => (
  <PiArrowsClockwise className={cn('h-4 w-4', spinning && 'animate-spin', className)} />
);

export const SyncIcon = ({ className }: IconProps) => (
  <PiArrowsClockwise className={cn('h-5 w-5', className)} />
);

// Status
export const CheckIcon = ({ className }: IconProps) => (
  <PiCheck className={cn('h-4 w-4', className)} />
);

export const CopyIcon = ({ className }: IconProps) => (
  <PiCopy className={cn('h-4 w-4', className)} />
);

export const XIcon = ({ className }: IconProps) => <PiX className={cn('h-4 w-4', className)} />;

export const LockIcon = ({ className }: IconProps) => (
  <PiLock className={cn('h-4 w-4', className)} />
);

export const InfoIcon = ({ className }: IconProps) => (
  <PiInfo className={cn('h-5 w-5', className)} />
);

// User & People
export const UserIcon = ({ className }: IconProps) => (
  <PiUser className={cn('h-5 w-5', className)} />
);

export const UsersIcon = ({ className }: IconProps) => (
  <PiUsers className={cn('h-5 w-5', className)} />
);

export const LogoutIcon = ({ className }: IconProps) => (
  <PiSignOut className={cn('h-5 w-5', className)} />
);

// Theme
export const SunIcon = ({ className }: IconProps) => <PiSun className={cn('h-5 w-5', className)} />;

export const MoonIcon = ({ className }: IconProps) => (
  <PiMoon className={cn('h-5 w-5', className)} />
);

export const PaletteIcon = ({ className }: IconProps) => (
  <PiPalette className={cn('h-5 w-5', className)} />
);

// Features & Content
export const SubscriptionIcon = ({ className }: IconProps) => (
  <PiSparkle className={cn('h-5 w-5', className)} />
);

export const WalletIcon = ({ className }: IconProps) => (
  <PiWallet className={cn('h-5 w-5', className)} />
);

export const ChatIcon = ({ className }: IconProps) => (
  <PiChatCircle className={cn('h-5 w-5', className)} />
);

export const GiftIcon = ({ className }: IconProps) => (
  <PiGift className={cn('h-4 w-4', className)} />
);

export const PumpkinIcon = ({ className, style }: IconProps) => (
  <svg
    viewBox="0 0 512 512"
    fill="currentColor"
    className={cn('h-4 w-4', className)}
    style={style}
    aria-hidden="true"
  >
    <path d="M366.313,58.34c-32.779-4.382-64.158,2.121-86.979,6.297V35.006c0-5.948-4.825-10.766-10.774-10.766h-25.13c-5.94,0-10.765,4.817-10.765,10.766v29.631c-22.821-4.176-54.2-10.679-86.987-6.297C32.612,73.464,0,152.872,0,246.401c0,115.273,76.197,203.035,180.989,231.503c23.722,6.439,48.916,9.856,75.01,9.856c26.095,0,51.289-3.417,75.003-9.856C435.803,449.436,512,361.674,512,246.401C512,152.872,479.387,73.464,366.313,58.34z M366.479,146.703l49.216,68.477l-104.08,10.868L366.479,146.703z M254.695,218.091l33.016,41.717c-3.915,0-66.982,0-66.982,0L254.695,218.091z M140.063,146.703l54.856,79.346L90.846,215.18L140.063,146.703z M355.113,408.857v-22.488h-44.929v38.933c-30.667,8.329-54.302,9.572-54.302,9.572s-22.251,0.719-51.62-5.664v-42.84h-44.937v28.144c-44.494-20.218-88.972-60.417-95.553-140.292c0,0,24.932,11.058,85.966,18.003v42.524h57.427v-38.094c14.365,0.68,31.443,1.076,49.122,1.076c20.012,0,37.042-0.506,54.991-1.36v38.379h55.639v-43.236c57.434-6.96,80.635-17.291,80.635-17.291C445.667,347.072,400.896,387.018,355.113,408.857z" />
  </svg>
);

export const EvilPumpkinIcon = ({ className, style }: IconProps) => (
  <svg
    viewBox="0 0 235.474 235.474"
    fill="currentColor"
    className={cn('h-4 w-4', className)}
    style={style}
    aria-hidden="true"
  >
    <path d="M233.562,100.368c-2.117-23.237-14.212-44.966-34.228-61.391c-21.863-17.94-50.841-27.82-81.598-27.82c-30.756,0-59.734,9.88-81.598,27.82C16.123,55.402,4.03,77.13,1.912,100.368C0.822,100.571,0,101.526,0,102.673v10.081c0,1.295,1.051,2.345,2.344,2.345h5.961c-2.607,8.145-4.037,16.975-4.037,26.202c0,40.787,27.873,73.851,62.258,73.851c5.402,0,10.643-0.815,15.639-2.351c10.426,7.312,22.584,11.515,35.572,11.515s25.146-4.201,35.572-11.515c4.998,1.533,10.238,2.351,15.639,2.351c34.386,0,62.261-33.063,62.261-73.851c0-9.229-1.433-18.059-4.039-26.202h5.961c1.293,0,2.344-1.05,2.344-2.345v-10.081C235.474,101.525,234.652,100.571,233.562,100.368z M49.758,191.49c-0.283,0.56-0.881,0.92-1.518,0.92c-0.215,0-0.424-0.039-0.621-0.118c-19.039-7.705-31.828-28.982-31.828-52.947c0-23.965,12.789-45.241,31.826-52.945c0.203-0.082,0.416-0.124,0.633-0.124c0.639,0,1.219,0.354,1.508,0.923c0.402,0.788,0.141,1.735-0.609,2.205c-15.545,9.732-25.201,28.869-25.201,49.941s9.656,40.209,25.203,49.942C49.898,189.757,50.162,190.703,49.758,191.49z M188.322,162.134l-12.685,9.278c-2.435,1.782-4.948,3.626-7.444,5.418l-10.062,7.23c-0.479,0.344-1.119,0.354-1.608,0.022l-11.353-7.668c-2.379-1.606-4.781-3.261-7.104-4.859c-1.041-0.717-2.082-1.433-3.123-2.146l-0.033-0.021l-5.01,3.492l-11.443,8.207c-0.217,0.146-0.461,0.223-0.709,0.235c-0.004,0.002-0.006,0.004-0.01,0.006c-0.002-0.002-0.006-0.004-0.006-0.005c-0.311,0.014-0.621-0.07-0.883-0.259l-10.232-7.46l-6.051-4.217l-0.031,0.021c-1.043,0.715-2.084,1.431-3.123,2.147c-2.326,1.599-4.727,3.252-7.107,4.858l-11.352,7.667c-0.488,0.331-1.131,0.321-1.607-0.021l-10.063-7.23c-2.492-1.792-5.012-3.636-7.445-5.418l-12.684-9.277c-0.543-0.398-0.729-1.125-0.441-1.734c0.287-0.607,0.965-0.93,1.619-0.766l27.016,6.826l23.051-19.671c0.463-0.394,1.123-0.446,1.643-0.134l17.696,10.719l17.697-10.717c0.521-0.312,1.181-0.26,1.644,0.135l23.053,19.67l27.016-6.826c0.652-0.164,1.332,0.156,1.617,0.766C189.051,161.009,188.865,161.736,188.322,162.134z M69.316,124.587L81.029,98.72c0.223-0.495,0.713-0.816,1.256-0.825c0.545-0.01,1.043,0.294,1.287,0.781l12.871,25.967c0.143,0.219,0.225,0.479,0.225,0.76c0,0.775-0.631,1.406-1.406,1.406c-0.002,0.001-0.008,0-0.01,0c-0.004,0-0.008,0-0.014,0l-24.654-0.234c-0.475-0.005-0.916-0.25-1.172-0.65C69.156,125.522,69.121,125.021,69.316,124.587z M138.808,125.402c0-0.28,0.082-0.541,0.226-0.76l12.873-25.967c0.242-0.487,0.742-0.791,1.285-0.781c0.545,0.009,1.032,0.33,1.258,0.825l11.711,25.868c0.195,0.434,0.16,0.936-0.096,1.336c-0.257,0.4-0.697,0.646-1.173,0.65l-24.653,0.234c-0.004,0-0.008,0-0.015,0c-0.002,0-0.006,0.001-0.01,0C139.439,126.809,138.808,126.179,138.808,125.402z M168.949,67.451c-5.4,0-10.642,0.815-15.64,2.35c-10.426-7.313-22.584-11.514-35.572-11.514s-25.146,4.201-35.572,11.514c-4.996-1.534-10.236-2.35-15.639-2.35c-19.756,0-37.359,10.917-48.766,27.939c7.444-39.148,49.436-69.229,99.977-69.229c50.54,0,92.52,30.076,99.971,69.22C206.301,78.363,188.699,67.451,168.949,67.451z" />
  </svg>
);

export const GhostIcon = ({ className, style }: IconProps) => (
  <svg
    viewBox="0 0 14 14"
    fill="currentColor"
    className={cn('h-4 w-4', className)}
    style={style}
    aria-hidden="true"
  >
    <path d="m 12.935244,5.6656867 c -0.08437,-0.23637 -0.253125,-0.44156 -0.350273,-0.675 -0.168281,-0.40453 -0.32482,-0.81515 -0.459023,-1.2321 -0.116695,-0.36223 -0.155015,-0.75352 -0.300937,-1.10145 -0.210116,-0.50109 -0.666537,-0.56707 -1.034646,-0.16301 -0.185273,0.20356 -0.309374,0.46336 -0.458788,0.69903 -0.169687,0.26812 -0.307499,0.56296 -0.5118733,0.80085 -0.326015,0.37934 -0.7019517,0.29227 -0.8754123,-0.17589 -0.043805,-0.11848 -0.059765,-0.2475 -0.087398,-0.37184 -0.1106248,-0.4964 -0.1788278,-1.00699 -0.3405462,-1.48605 -0.2530542,-0.75 -0.8075843,-1.09382996 -1.4124581,-0.91277 -0.4674599,0.13992 -0.9202715,0.32883 -1.4333173,0.5155 0.058429,0.11227 0.1343434,0.23602 0.1881558,0.36891 0.039562,0.0978 0.070359,0.20754 0.069961,0.31184 -0.00164,0.3757 -0.0011,0.75281 -0.034922,1.1264 -0.022617,0.25019 -0.020672,0.60246 -0.1740231,0.71871 -0.2539916,0.19254 -0.4389366,-0.13617 -0.6049206,-0.30938 -0.1842184,-0.19207 -0.3336321,-0.41718 -0.5021943,-0.62472 -0.1122185,-0.13805 -0.2192105,-0.28371 -0.3495227,-0.40312 -0.7256235,-0.66434 -1.5026453,-0.46899 -1.8864805,0.47542 -0.4143741,1.01965 -0.565241,2.14348 -1.2807865,3.04687 -0.24445263,0.30867 0.065344,0.72305 0.4881553,0.71051 0.2029684,-0.006 0.4061242,-0.0662 0.6070769,-0.0567 0.1016482,0.005 0.2793744,0.10303 0.2851635,0.17074 0.06382,0.74496 0.6143425,0.96773 1.1992241,1.16531 0.5519051,0.18656 1.1234742,0.34266 1.4541064,0.94971 0.4248038,-0.89238 0.2883509,-1.77283 0.2457416,-2.64726 0.2207105,0.62552 0.2537573,1.26691 0.1297732,1.90218 -0.074062,0.37955 -0.1606168,0.81586 -0.3987179,1.09041 -0.364054,0.41988 -0.4081632,0.8309703 -0.3476477,1.3383003 0.061055,0.51105 0.029719,1.03254 0.054562,1.54875 0.00773,0.16136 0.01664,0.40277 0.1131325,0.46078 0.1467185,0.088 0.4414444,0.13406 0.5479677,0.0462 0.3263665,-0.2693 0.637733,-0.58101 0.8722247,-0.93152 0.3400071,-0.50848 0.7787562,-0.78914 1.3780519,-0.83932 0.1524606,-0.0128 0.3051087,-0.0237 0.4575459,-0.0366 0.8649592,-0.0731 1.2643334,-0.38977 1.3865597,-1.2378503 0.1359372,-0.94287 0.1960543,-1.89668 0.2919134,-2.8454 0.043359,-0.42973 0.075469,-0.86168 0.1453119,-1.2873 0.06457,-0.39293 0.220195,-0.58407 0.474843,-0.68379 -0.8292169,1.29691 -0.256875,2.7928 -0.672186,4.14843 0.041695,0.0147 0.083531,0.0293 0.125156,0.0441 0.104531,-0.0671 0.202968,-0.14834 0.315468,-0.1977 0.11482,-0.0505 0.241851,-0.0788 0.366561,-0.10125 0.595546,-0.10781 0.656015,-0.16673 0.618398,-0.77306 -0.0177,-0.28289 0.05742,-0.47085 0.340663,-0.55314 0.352499,-0.10228 0.494179,-0.35731 0.444749,-0.70067 -0.05848,-0.40593 0.04345,-0.60796 0.501913,-0.62906 0.423093,-0.0195 0.556804,-0.26217 0.413695,-0.66295 z m -6.0207062,-2.74253 c -0.062414,0.24129 -0.435421,0.13886 -0.3728899,-0.10278 0.026484,-0.10265 0.074062,-0.21093 0.050976,-0.31804 -0.022219,-0.10301 0.029227,-0.20883 0.1350466,-0.23789 0.097195,-0.0267 0.2156245,0.032 0.2378198,0.13511 0.039914,0.18481 -0.00485,0.34547 -0.050953,0.5236 z m 1.1708647,1.09699 c -0.04282,0.12164 -0.1075779,0.22113 -0.2214136,0.28793 -0.091242,0.0534 -0.1988433,0.0743 -0.3032337,0.0614 l -0.00169,0.002 c -5.859e-4,-9.3e-4 -0.00117,-0.002 -0.00176,-0.003 -0.02175,-0.003 -0.043359,-0.007 -0.06457,-0.0125 -0.1519216,-0.0417 -0.2810854,-0.16898 -0.3334212,-0.31968 -0.021492,-0.0367 -0.039375,-0.0763 -0.05414,-0.11872 -0.011906,-0.0345 -0.02632,-0.0677 -0.038203,-0.10218 -0.039211,-0.11309 -0.01507,-0.25266 0.041133,-0.35684 0.021562,-0.0798 0.06164,-0.15457 0.1209841,-0.21386 0.1905699,-0.19055 0.4893271,-0.17883 0.681397,0 0.2058512,0.19171 0.2670229,0.51304 0.1749137,0.77484 z m 0.066211,-1.24992 c -0.073758,0.2373 -0.4471162,0.13594 -0.3728898,-0.10289 0.017414,-0.0561 0.025148,-0.096 0.026203,-0.14555 6.328e-4,-0.0309 0.0011,-0.0622 -0.0027,-0.0931 0.00398,0.0322 -0.0225,-0.0619 -0.00405,-0.0205 -0.043008,-0.0963 -0.028805,-0.20707 0.069375,-0.26461 0.083461,-0.0489 0.2215543,-0.0268 0.264562,0.0694 0.077742,0.17391 0.075679,0.37629 0.0195,0.55723 z" />
  </svg>
);

export const ClockIcon = ({ className }: IconProps) => (
  <PiClock className={cn('h-5 w-5', className)} />
);

export const StarIcon = ({ className, filled }: IconProps & { filled?: boolean }) =>
  filled ? (
    <PiStarFill className={cn('h-5 w-5', className)} />
  ) : (
    <PiStar className={cn('h-5 w-5', className)} />
  );

export const GamepadIcon = ({ className }: IconProps) => (
  <PiGameController className={cn('h-5 w-5', className)} />
);

export const ClipboardIcon = ({ className }: IconProps) => (
  <PiClipboardText className={cn('h-5 w-5', className)} />
);

export const CogIcon = ({ className }: IconProps) => (
  <PiGearSix className={cn('h-5 w-5', className)} />
);

export const WheelIcon = ({ className }: IconProps) => (
  <PiDiceFive className={cn('h-5 w-5', className)} />
);

export const ShieldIcon = ({ className }: IconProps) => (
  <PiShield className={cn('h-5 w-5', className)} />
);

export const ServerIcon = ({ className }: IconProps) => (
  <PiHardDrives className={cn('h-5 w-5', className)} />
);

export const CampaignIcon = ({ className }: IconProps) => (
  <PiMegaphone className={cn('h-5 w-5', className)} />
);

// Brand mark — the genuine Remnawave panel logo (kept as-is, this is the
// panel's own SVG, not a hand-drawn substitute).
export const RemnawaveIcon = ({ className }: IconProps) => (
  <svg
    className={cn('h-5 w-5', className)}
    fill="none"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M8 1a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-1.5 0V1.75A.75.75 0 0 1 8 1Zm6 2a.75.75 0 0 1 .75.75v8.5a.75.75 0 0 1-1.5 0v-8.5A.75.75 0 0 1 14 3ZM5 4a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5A.75.75 0 0 1 5 4Zm6 1a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 11 5ZM2 6a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 2 6Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export const ChartIcon = ({ className }: IconProps) => (
  <PiChartBar className={cn('h-4 w-4', className)} />
);

// Xray core brand logo (4-blade pinwheel) — matches the panel's node rows.
// Not a Phosphor glyph; kept custom like RemnawaveIcon for brand fidelity.
export const XrayIcon = ({ className }: IconProps) => (
  <svg
    className={cn('h-5 w-5', className)}
    fill="currentColor"
    viewBox="0 0 35 35"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M16.6961 15.2606L16.5825 3.49701C16.5718 2.38439 15.025 2.11843 14.6433 3.16356L11.7279 11.1447C11.6384 11.3898 11.4566 11.5902 11.2213 11.7031L5.66765 14.3687C4.70841 14.8291 5.03635 16.2703 6.10036 16.2703H15.6962C16.2522 16.2703 16.7015 15.8166 16.6961 15.2606Z" />
    <path d="M18.6471 15.2703V5.88936C18.6471 4.84679 20.0428 4.49998 20.5308 5.4213L23.5833 11.1845C23.7 11.4049 23.8948 11.5737 24.1296 11.6578L31.5829 14.3289C32.6388 14.7073 32.3671 16.2703 31.2455 16.2703H19.6471C19.0948 16.2703 18.6471 15.8226 18.6471 15.2703Z" />
    <path d="M18.6471 31.4643V19.3784C18.6471 18.8261 19.0948 18.3784 19.6471 18.3784H29.2853C30.3376 18.3784 30.676 19.7947 29.7374 20.2704L24.1129 23.1208C23.889 23.2343 23.716 23.4278 23.6281 23.663L20.5839 31.8141C20.1941 32.8578 18.6471 32.5783 18.6471 31.4643Z" />
    <path d="M16.7059 28.9873V19.3784C16.7059 18.8261 16.2582 18.3784 15.7059 18.3784H3.83963C2.71522 18.3784 2.44656 19.9473 3.50691 20.3214L11.5457 23.1578C11.7987 23.247 12.0052 23.4342 12.1188 23.6772L14.8 29.4109C15.2531 30.3797 16.7059 30.0568 16.7059 28.9873Z" />
  </svg>
);

export const GlobeIcon = ({ className }: IconProps) => (
  <PiGlobe className={cn('h-5 w-5', className)} />
);

export const PlayIcon = ({ className }: IconProps) => (
  <PiPlay className={cn('h-4 w-4', className)} />
);

export const StopIcon = ({ className }: IconProps) => (
  <PiStop className={cn('h-4 w-4', className)} />
);

export const ArrowPathIcon = ({ className }: IconProps) => (
  <PiArrowsClockwise className={cn('h-4 w-4', className)} />
);

export const PauseIcon = ({ className, style }: IconProps & { style?: CSSProperties }) => (
  <PiPauseCircle className={cn('h-5 w-5', className)} style={style} />
);

export const CreditCardIcon = ({ className }: IconProps) => (
  <PiCreditCard className={cn('h-5 w-5', className)} />
);
/** Смена выхода в повторе GEO: «перемешать» — другой провайдер или IP в том же городе. */
export const ShuffleIcon = ({ className }: IconProps) => (
  <PiShuffle className={cn('h-4 w-4', className)} />
);
