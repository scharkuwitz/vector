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
 * The logo mark: a vector drawn as in a maths textbook. It is a bold arrow
 * from an origin point, with its two components shown faintly. Neutral ink,
 * because blue means priority. The favicon (src/app/icon.svg) is the same
 * drawing on a dark tile.
 */
export function LogoMark({ size = 20, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M4 20h11M15 20V8" strokeWidth={1.6} opacity={0.45} />
      <path d="M4 20 18.5 5.5M11.5 5h7.5v7.5" strokeWidth={2.3} />
      <circle cx="4" cy="20" r="1.9" fill="currentColor" stroke="none" />
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
