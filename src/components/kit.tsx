import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, Search, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_META, type Status, type Tone } from "@/lib/fixtures";

/* ---------- Button ---------- */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-card hover:bg-primary/90",
        outline: "border border-input bg-card text-foreground shadow-card hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        link: "text-primary hover:underline px-0",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: { sm: "h-8 px-3 text-[13px]", md: "h-9 px-3.5 text-sm", lg: "h-10 px-4 text-sm", icon: "h-9 w-9" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { loading?: boolean | undefined; disabledReason?: string | undefined; icon?: LucideIcon };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, disabledReason, icon: Icon, children, ...props }, ref) => {
    const isDisabled = disabled || loading;
    const btn = (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={isDisabled && !disabledReason}
        aria-disabled={isDisabled || undefined}
        {...props}
        onClick={isDisabled ? (e) => e.preventDefault() : props.onClick}
        data-disabled={isDisabled ? "" : undefined}
        style={isDisabled && disabledReason ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
      >
        {loading ? <Loader2 className="animate-spin" /> : Icon ? <Icon /> : null}
        {children}
      </button>
    );
    if (isDisabled && disabledReason) return <Tip label={disabledReason}>{btn}</Tip>;
    return btn;
  },
);
Button.displayName = "Button";

/* ---------- Tooltip ---------- */
export function Tip({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={6}
            className="z-[60] max-w-60 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-pop"
          >
            {label}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

/* ---------- Inputs ---------- */
const fieldBase =
  "w-full rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => <input ref={ref} className={cn(fieldBase, "h-9 px-3", className)} {...p} />,
);
Input.displayName = "Input";

export function SearchInput({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" className="pl-9" {...p} />
    </div>
  );
}

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...p }, ref) => <select ref={ref} className={cn(fieldBase, "h-9 px-2.5 pr-8", className)} {...p} />,
);
Select.displayName = "Select";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => <textarea ref={ref} className={cn(fieldBase, "min-h-20 px-3 py-2", className)} {...p} />,
);
Textarea.displayName = "Textarea";

export function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string | undefined; hint?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/* ---------- Card ---------- */
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border bg-card text-card-foreground shadow-card", className)} {...p} />;
}
export function CardHeader({ title, sub, action }: { title: string; sub?: string | undefined; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {sub && <p className="text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Badge ---------- */
const toneCls: Record<Tone, string> = {
  info: "bg-st-info-bg text-st-info border-st-info/25",
  success: "bg-st-success-bg text-st-success border-st-success/25",
  warning: "bg-st-warning-bg text-st-warning border-st-warning/25",
  danger: "bg-st-danger-bg text-st-danger border-st-danger/25",
  teal: "bg-st-teal-bg text-st-teal border-st-teal/25",
  neutral: "bg-st-neutral-bg text-st-neutral border-st-neutral/20",
};
export function Badge({ tone = "neutral", icon: Icon, children, className }: { tone?: Tone | undefined; icon?: LucideIcon | undefined; children: React.ReactNode; className?: string | undefined }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-xs font-semibold", toneCls[tone], className)}>
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

const dot: Record<Tone, string> = {
  info: "bg-st-info",
  success: "bg-st-success",
  warning: "bg-st-warning",
  danger: "bg-st-danger",
  teal: "bg-st-teal",
  neutral: "bg-st-neutral",
};
export function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold", toneCls[m.tone])}>
      <span className={cn("size-1.5 rounded-full", dot[m.tone])} aria-hidden />
      {m.label}
    </span>
  );
}

/* ---------- Tabs (segmented, Itera-style) ---------- */
export function Tabs<T extends string>({ value, onChange, items, label }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number | undefined; icon?: LucideIcon }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((it) => {
        const sel = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={sel}
            onClick={() => onChange(it.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold transition-colors focus-ring",
              sel ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-foreground hover:bg-muted",
            )}
          >
            {it.icon && <it.icon className="size-4" />}
            {it.label}
            {it.count !== undefined && <span className={cn("tabular-nums", sel ? "opacity-90" : "text-muted-foreground")}>· {it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Table ---------- */
export function Table({ children, className }: { children: React.ReactNode; className?: string | undefined }) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}
export function Th({ children, className }: { children?: React.ReactNode | undefined; className?: string | undefined }) {
  return <th className={cn("border-b bg-surface px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}>{children}</th>;
}
export function Td({ children, className }: { children?: React.ReactNode | undefined; className?: string | undefined }) {
  return <td className={cn("border-b px-3 py-2 align-middle", className)}>{children}</td>;
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: string | undefined; action?: React.ReactNode }) {
  return (
    <div className="m-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
      <Icon className="size-6 text-muted-foreground" aria-hidden />
      <p className="font-semibold">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action}
    </div>
  );
}

/* ---------- Drawer ---------- */
export function Drawer({ open, onOpenChange, title, sub, children, footer, returnFocusRef }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  sub?: React.ReactNode | undefined;
  children: React.ReactNode;
  footer?: React.ReactNode | undefined;
  returnFocusRef?: React.RefObject<HTMLElement | null> | undefined;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/25 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onCloseAutoFocus={(e) => {
            if (returnFocusRef?.current) {
              e.preventDefault();
              returnFocusRef.current.focus();
            }
          }}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l bg-card shadow-drawer focus:outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right"
        >
          <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-lg font-bold">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description asChild>
                <div className="text-[13px] text-muted-foreground">{sub}</div>
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className={cn(buttonVariants({ variant: "ghost", size: "icon" }))} aria-label="Close">
              <X />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="border-t px-5 py-3">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, sub, actions }: { title: string; sub?: React.ReactNode | undefined; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function DL({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1.5 text-sm">
      {items.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="min-w-0 font-medium">{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
