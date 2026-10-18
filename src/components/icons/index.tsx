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

export const PumpkinIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 512 512"
    fill="currentColor"
    className={cn('h-4 w-4', className)}
    aria-hidden="true"
  >
    <path d="M366.313,58.34c-32.779-4.382-64.158,2.121-86.979,6.297V35.006c0-5.948-4.825-10.766-10.774-10.766h-25.13c-5.94,0-10.765,4.817-10.765,10.766v29.631c-22.821-4.176-54.2-10.679-86.987-6.297C32.612,73.464,0,152.872,0,246.401c0,115.273,76.197,203.035,180.989,231.503c23.722,6.439,48.916,9.856,75.01,9.856c26.095,0,51.289-3.417,75.003-9.856C435.803,449.436,512,361.674,512,246.401C512,152.872,479.387,73.464,366.313,58.34z M366.479,146.703l49.216,68.477l-104.08,10.868L366.479,146.703z M254.695,218.091l33.016,41.717c-3.915,0-66.982,0-66.982,0L254.695,218.091z M140.063,146.703l54.856,79.346L90.846,215.18L140.063,146.703z M355.113,408.857v-22.488h-44.929v38.933c-30.667,8.329-54.302,9.572-54.302,9.572s-22.251,0.719-51.62-5.664v-42.84h-44.937v28.144c-44.494-20.218-88.972-60.417-95.553-140.292c0,0,24.932,11.058,85.966,18.003v42.524h57.427v-38.094c14.365,0.68,31.443,1.076,49.122,1.076c20.012,0,37.042-0.506,54.991-1.36v38.379h55.639v-43.236c57.434-6.96,80.635-17.291,80.635-17.291C445.667,347.072,400.896,387.018,355.113,408.857z" />
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
