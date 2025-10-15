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
    "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black";
  const styles = {
    primary: "text-white border-0 shadow-lg hover:shadow-xl",
    secondary: "bg-transparent text-white border border-gray-700/50 hover:bg-gray-900/50 hover:border-gray-600/50",
    ghost: "text-gray-300 hover:text-white hover:bg-gray-900/50",
  }[variant];

  const primaryStyle = variant === "primary" ? { backgroundColor: 'rgb(84, 0, 250)', borderColor: 'rgb(84, 0, 250)' } : {};

  if (as === "a" && href)
    return (
      <a href={href} className={clsx(base, styles, className)} style={primaryStyle} {...(props as any)} />
    );

  return <button className={clsx(base, styles, className)} style={primaryStyle} {...props} />;
}
