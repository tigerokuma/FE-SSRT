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
        "h-full rounded-2xl border border-gray-800/50 p-8 shadow-2xl transition-all duration-300 hover:border-gray-700/50 hover:shadow-3xl",
        className
      )}
      style={{ backgroundColor: 'rgb(18, 18, 18)' }}
    >
      {(eyebrow || rightChip) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {eyebrow ? (
            <div className="text-xs font-medium text-gray-300">{eyebrow}</div>
          ) : (
            <span />
          )}
          {rightChip && (
            <div className="rounded-full border border-gray-700/50 bg-gray-900/50 px-3 py-1 text-xs font-medium text-gray-300">
              {rightChip}
            </div>
          )}
        </div>
      )}

      <h3
        className={clsx(
          variant === "metric"
            ? "text-6xl font-bold leading-[1.1] text-white"
            : "mb-3 text-2xl font-bold leading-7 text-white"
        )}
      >
        {title}
      </h3>

      {body && <p className="mt-2 text-base leading-6 text-gray-400">{body}</p>}

      {children}
    </div>
  );
}
