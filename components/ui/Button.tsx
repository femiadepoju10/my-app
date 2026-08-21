import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline" | "success" | "warning";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
  href?: string;
}

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps & Record<string, any>>(
  ({ className = "", variant = "primary", size = "md", isLoading, children, disabled, href, ...props }: any, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants: Record<ButtonVariant, string> = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm hover:shadow-md",
      secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-500 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
      ghost: "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 focus:ring-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md",
      outline: "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
      success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm hover:shadow-md",
      warning: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 shadow-sm hover:shadow-md",
    };

    const sizes: Record<ButtonSize, string> = {
      sm: "px-3 py-1.5 text-xs rounded-lg",
      md: "px-4 py-2.5 text-sm rounded-xl",
      lg: "px-6 py-3.5 text-base rounded-xl",
    };

    const combinedClassName = `${baseStyles} ${variants[variant as ButtonVariant]} ${sizes[size as ButtonSize]} ${className}`;

    if (href) {
      return (
        <a
          ref={ref as any}
          href={href}
          className={combinedClassName}
          suppressHydrationWarning
          {...props}
        >
          {isLoading && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {children}
        </a>
      );
    }

    return (
      <button
        ref={ref as any}
        className={combinedClassName}
        disabled={disabled || isLoading}
        suppressHydrationWarning
        {...props}
      >
        {isLoading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
