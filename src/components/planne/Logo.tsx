import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}

/**
 * PLANNE mark — geometric "P" formed by orthogonal blueprint lines,
 * nodding to architectural plans. No gradients, no rounded plastic shapes.
 */
export function Logo({ className, showWordmark = true, size = 22 }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect x="0.5" y="0.5" width="23" height="23" rx="3" stroke="currentColor" strokeOpacity="0.18" />
        <path
          d="M6 5.5V18.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="square"
        />
        <path
          d="M6 5.5H14.5C16.7 5.5 18.5 7.3 18.5 9.5C18.5 11.7 16.7 13.5 14.5 13.5H6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="square"
        />
        <circle cx="6" cy="5.5" r="1.1" fill="currentColor" />
        <circle cx="6" cy="13.5" r="1.1" fill="currentColor" />
        <circle cx="14.5" cy="9.5" r="1.1" fill="var(--accent)" />
      </svg>
      {showWordmark && (
        <span
          className="font-display text-[15px] font-semibold tracking-tight"
          style={{ letterSpacing: "-0.02em" }}
        >
          Planne
        </span>
      )}
    </div>
  );
}
