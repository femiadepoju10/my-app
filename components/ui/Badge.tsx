import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        primary: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string;
  children: React.ReactNode;
}

function Badge({ variant, size, className, children }: BadgeProps) {
  return (
    <span className={badgeVariants({ variant, size, className })}>
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
