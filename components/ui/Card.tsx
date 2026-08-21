import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ className, children, hover = false, padding = "md" }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200",
        "dark:border-zinc-800 dark:bg-zinc-950",
        hover && "hover:shadow-lg hover:-translate-y-0.5",
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("border-b border-zinc-100 px-6 py-4 dark:border-zinc-800", className)}>
      {children}
    </div>
  );
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("border-t border-zinc-100 px-6 py-4 dark:border-zinc-800", className)}>
      {children}
    </div>
  );
}
