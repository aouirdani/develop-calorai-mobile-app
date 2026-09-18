/**
 * Icônes SVG inline (trait, style lucide) — aucune dépendance externe.
 */
import type { ReactNode, SVGProps } from "react";

const PATHS = {
  logo: (
    <>
      <path d="M4 11h16a8 8 0 0 1-5 7.4V20H9v-1.6A8 8 0 0 1 4 11z" />
      <path d="M9.5 7.5c0-2 1.5-2 1.5-4M14 7.5c0-2 1.5-2 1.5-4" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-5.5h5V21" />
    </>
  ),
  journal: (
    <>
      <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4.5 4.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  barcode: (
    <>
      <path d="M4 5v14M8 5v14M12 5v14M16 5v8M20 5v14" />
      <path d="M16 17v2" />
    </>
  ),
  gallery: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m21 15-5-5-9 9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m4 12.5 5 5L20 6.5" />,
  "chevron-left": <path d="M15 5l-7 7 7 7" />,
  "chevron-right": <path d="M9 5l7 7-7 7" />,
  "chevron-down": <path d="M5 9l7 7 7-7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  alert: (
    <>
      <path d="M12 3 2.5 20h19z" />
      <path d="M12 9.5v4.5" />
      <path d="M12 17.2v.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v.01M12 11.5V17" />
    </>
  ),
  refresh: (
    <>
      <path d="M20.5 8.5A9 9 0 0 0 5 6.5L3 9" />
      <path d="M3 4v5h5" />
      <path d="M3.5 15.5A9 9 0 0 0 19 17.5l2-2.5" />
      <path d="M21 20v-5h-5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="7" cy="17" r="2" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  wifiOff: (
    <>
      <path d="M2 2l20 20" />
      <path d="M5 12a11 11 0 0 1 5.4-2.9M15.5 10.5c1.6.6 3 1.5 4.2 2.7" />
      <path d="M8.5 15.5a6 6 0 0 1 4.4-1.7" />
      <path d="M12 20h.01" />
      <path d="M9.5 5.5A15 15 0 0 1 22 8.7" />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 4l1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7z" />
      <path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </>
  ),
  flame: (
    <path d="M12 3c2 3 .5 4.8-.6 6.4C10.2 11.2 9 12.6 9 15a3.5 3.5 0 0 0 7 .3c0-1-.4-1.9-1-2.7 2.5.7 4 2.7 4 5.2A7 7 0 0 1 5 17c0-4.6 4.4-6.5 6-14z" />
  ),
  weight: (
    <>
      <circle cx="12" cy="14" r="7" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </>
  ),
  ruler: (
    <>
      <path d="M3 17 17 3l4 4L7 21z" />
      <path d="m8 12 2 2M11 9l2 2M14 6l2 2" />
    </>
  ),
  "arrow-right": <path d="M4 12h16M13 5l7 7-7 7" />,
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6z" />,
  leaf: (
    <>
      <path d="M4 20C4 11 9 4 20 4c0 11-7 16-16 16z" />
      <path d="M4 20c4-6 8-9 12-11" />
    </>
  ),
  edit: <path d="M4 20l4-1L20 7l-3-3L5 16z" />,
  plate: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  ...rest
}: { name: IconName; size?: number; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  const node: ReactNode = PATHS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {node}
    </svg>
  );
}
