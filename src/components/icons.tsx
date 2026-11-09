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
 * The logo mark: three vectors of different lengths from one origin, in red,
 * green and blue (the x/y/z axis colors). The logo is the one place outside
 * the data where these hues appear; they come from the --logo-* tokens so
 * they adapt to dark mode. The favicon (src/app/icon.svg) is the same
 * drawing on a dark tile.
 */
export function LogoMark({ size = 22, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path stroke="var(--logo-r)" d="M4 20h17M17.5 16.5 21 20l-3.5 3.5" />
      <path stroke="var(--logo-g)" d="M4 20 14.5 9.5M9.5 9.5h5v5" />
      <path stroke="var(--logo-b)" d="M4 20V8M1 11l3-3 3 3" />
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
