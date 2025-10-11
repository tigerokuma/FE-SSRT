import clsx from "clsx";
import { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  rightChip?: string;
  title: string;
  body?: string;
  children?: ReactNode;
  variant?: "default" | "metric";
  className?: string;
};

export default function CardFeature({
  eyebrow,
  rightChip,
  title,
  body,
  children,
  variant = "default",
  className,
}: Props) {
  return (
    <div
      className={clsx(
        "h-full rounded-xl border border-[#E5E7EB] bg-white p-6",
        className
      )}
    >
      {(eyebrow || rightChip) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {eyebrow ? (
            <div className="text-xs font-medium text-black">{eyebrow}</div>
          ) : (
            <span />
          )}
          {rightChip && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-black/10 px-3 py-0.5 text-xs font-medium text-black">
              {rightChip}
            </div>
          )}
        </div>
      )}

      <h3
        className={clsx(
          variant === "metric"
            ? "text-[48px] font-semibold leading-[56px] text-black"
            : "mb-2 text-[20px] font-semibold leading-6 text-black"
        )}
      >
        {title}
      </h3>

      {body && <p className="mt-1 text-[16px] leading-6 text-black/80">{body}</p>}

      {children}
    </div>
  );
}
