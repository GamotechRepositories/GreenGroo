import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-md active:scale-[0.98]',
        secondary:
          'bg-secondary/15 text-primary hover:bg-secondary/25 active:scale-[0.98]',
        outline:
          'border border-border bg-card text-text-primary hover:border-primary/40 hover:bg-cream active:scale-[0.98]',
        ghost: 'text-text-secondary hover:bg-muted hover:text-text-primary',
        accent:
          'bg-accent text-text-primary shadow-sm hover:brightness-105 active:scale-[0.98]',
        danger:
          'bg-error text-white shadow-sm hover:brightness-110 active:scale-[0.98]',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3.5 text-xs',
        lg: 'h-11 px-6 text-sm',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export function Button({ className, variant, size, asChild, children, ...props }) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </button>
  )
}

export { buttonVariants }
