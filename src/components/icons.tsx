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

/** Three stacked bars: the wordmark's mark. */
export function LogoMark(props: IconProps) {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true" focusable="false" {...props}>
      <rect x="1" y="2" width="9" height="3.5" rx="1.75" fill="var(--prio-low)" />
      <rect x="5" y="7.25" width="12" height="3.5" rx="1.75" fill="var(--prio-medium)" />
      <rect x="3" y="12.5" width="8" height="3.5" rx="1.75" fill="currentColor" />
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
