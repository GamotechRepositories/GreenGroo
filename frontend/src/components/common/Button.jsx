import React from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onClick,
  type = "button",
  ...props
}) {
  const baseStyle =
    "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary: "bg-[#0C831F] text-white hover:bg-[#097019] active:scale-95 shadow-xs",
    secondary: "bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-xs",
    outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:scale-95",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-xs",
  };

  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
