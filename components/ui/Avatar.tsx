import { cva, type VariantProps } from "class-variance-authority";

const avatarVariants = cva(
  "relative flex shrink-0 items-center justify-center rounded-full font-medium text-white",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
}

export function Avatar({ src, alt, fallback, size, className }: AvatarProps) {
  return (
    <div className={avatarVariants({ size, className })}>
      {src ? (
        <img
          src={src}
          alt={alt || fallback || "Avatar"}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span className="bg-gradient-to-br from-indigo-500 to-purple-600">
          {fallback?.slice(0, 2).toUpperCase() || "U"}
        </span>
      )}
    </div>
  );
}
