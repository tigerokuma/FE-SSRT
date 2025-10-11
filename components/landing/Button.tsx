import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  as?: "button" | "a";
  href?: string;
};

export default function Button({
  variant = "primary",
  className,
  as = "button",
  href,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-4 text-base transition-colors";
  const styles = {
    primary: "bg-[#111] text-white border border-[#E5E7EB] hover:opacity-90",
    secondary: "bg-white text-[#111] border border-[#E5E7EB] hover:bg-black/5",
    ghost: "text-[#111] hover:bg-black/5",
  }[variant];

  if (as === "a" && href)
    return (
      <a href={href} className={clsx(base, styles, className)} {...(props as any)} />
    );

  return <button className={clsx(base, styles, className)} {...props} />;
}
