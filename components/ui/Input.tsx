import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, icon, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            suppressHydrationWarning
            className={`
              w-full rounded-xl border bg-white py-2.5 text-sm text-zinc-900 transition-all duration-200
              placeholder-zinc-400
              focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none
              disabled:cursor-not-allowed disabled:opacity-50
              dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500
              ${icon ? 'pl-10 pr-3' : 'px-3'}
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-300 dark:border-zinc-700'}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
