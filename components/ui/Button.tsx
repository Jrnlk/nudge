import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type Variant = "primary" | "brand" | "ghost" | "link";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold no-underline transition disabled:opacity-50 disabled:cursor-default";
const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-ink hover:brightness-110",
  brand: "bg-brand text-brand-ink hover:brightness-105",
  ghost: "bg-transparent text-ink shadow-[inset_0_0_0_1px_var(--line)] hover:bg-soft",
  link: "bg-transparent text-ink hover:bg-soft",
};
const sizes: Record<Size, string> = {
  md: "px-[18px] py-[11px] text-[15px]",
  sm: "px-3 py-[7px] text-[13.5px]",
};

export const buttonClass = (variant: Variant = "primary", size: Size = "md") =>
  `${base} ${variants[variant]} ${sizes[size]}`;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={`${buttonClass(variant, size)} ${className}`} {...rest} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={`${buttonClass(variant, size)} ${className}`} {...rest} />;
}
