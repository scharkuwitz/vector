import type { SVGProps } from "react";
import type { Status } from "@/lib/types";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 14, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/**
 * The logo mark: three vectors as 3D axes from one origin, in the x/y/z axis
 * colors: red (x, to the right), green (y, up, the longest) and blue (z, toward
 * the viewer, the shortest). It sits on a dark tile, so the colors are fixed
 * and look the same in light and dark mode. src/app/icon.svg is the same image.
 */
export function LogoMark({ size = 28, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
      <rect x=".5" y=".5" width="23" height="23" rx="5.5" fill="#0b0b0b" stroke="#fff" strokeOpacity=".14" />
      <g strokeLinecap="round" strokeLinejoin="round">
        <path stroke="#6aa6ff" strokeWidth="2.4" d="M9.67 15.29 7.16 17.7" />
        <path fill="#6aa6ff" stroke="#6aa6ff" strokeWidth=".66" d="M4.89 19.87 5.92 15.68 9.12 19.02Z" />
        <path stroke="#ff6b70" strokeWidth="2.4" d="M9.67 15.29 15.99 16.05" />
        <path fill="#ff6b70" stroke="#ff6b70" strokeWidth=".66" d="M19.11 16.43 15.22 18.29 15.77 13.69Z" />
        <path stroke="#3dd68c" strokeWidth="2.4" d="M9.67 15.29V7.27" />
        <path fill="#3dd68c" stroke="#3dd68c" strokeWidth=".66" d="M9.67 4.13 11.98 7.77H7.35Z" />
      </g>
      <circle cx="9.67" cy="15.29" r="1.82" fill="#f0efec" />
    </svg>
  );
}

export function StatusIcon({ status, ...props }: IconProps & { status: Status }) {
  if (status === "done") {
    return (
      <Svg {...props}>
        <circle cx="8" cy="8" r="6.25" fill="currentColor" stroke="none" />
        <path d="M5.25 8.25 7.1 10l3.65-3.9" stroke="var(--surface)" strokeWidth={1.75} />
      </Svg>
    );
  }
  if (status === "in_progress") {
    return (
      <Svg {...props}>
        <circle cx="8" cy="8" r="6" />
        <path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor" stroke="none" />
      </Svg>
    );
  }
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="6" />
    </Svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 1.75 15 14.25H1z" fill="currentColor" stroke="currentColor" strokeWidth={1.25} />
      <path d="M8 6.25v3.5" stroke="var(--surface)" strokeWidth={1.6} />
      <circle cx="8" cy="11.9" r="0.95" fill="var(--surface)" stroke="none" />
    </Svg>
  );
}

export function ChevronIcon({ open, ...props }: IconProps & { open: boolean }) {
  return (
    <Svg {...props}>
      <path d={open ? "M4 6l4 4 4-4" : "M6 4l4 4-4 4"} />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 3v10M3 8h10" />
    </Svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 8H3M7 4 3 8l4 4" />
    </Svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 2H2.5v12H6M6 8h8M11 5l3 3-3 3" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="8" cy="8" r="2.75" />
      <path d="M8 1.5v1.25M8 13.25v1.25M1.5 8h1.25M13.25 8h1.25M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.5 9.6A5.75 5.75 0 0 1 6.4 2.5a5.75 5.75 0 1 0 7.1 7.1Z" />
    </Svg>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="1.75" y="2.5" width="12.5" height="8.5" rx="1.25" />
      <path d="M5.5 14h5M8 11v3" />
    </Svg>
  );
}
