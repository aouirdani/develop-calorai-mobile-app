/**
 * Primitives UI de la preview (miroir fidèle des composants React Native).
 */
import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import type { NutriRange } from "../../mobile/types/api";
import { fmtEst, fmtRangeSub, pct } from "../../mobile/utils/format";
import { Icon, type IconName } from "./Icon";
import { useDir } from "./shell";

/* ----- Écran ----- */

export function Screen({
  children,
  dark = false,
  className,
  padded = true,
}: {
  children: ReactNode;
  dark?: boolean;
  className?: string;
  padded?: boolean;
}) {
  const dir = useDir();
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col overflow-hidden",
        dark ? "bg-shell-900 text-[#F2F6EC]" : "bg-paper text-ink",
        dir === "pop" ? "anim-slide-l" : dir === "push" ? "anim-slide-r" : "anim-pop",
        padded && "px-5 pt-4 pb-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-current/15 bg-current/5 transition-transform active:scale-90"
            aria-label="Retour"
          >
            <Icon name="chevron-left" size={17} strokeWidth={2.5} />
          </button>
        ) : null}
        <h1 className="font-display text-[17px] font-bold tracking-tight">{title}</h1>
      </div>
      {right}
    </div>
  );
}

/* ----- Boutons ----- */

type BtnVariant = "primary" | "dark" | "outline" | "ghost" | "danger" | "accent";

export function Btn({
  children,
  onClick,
  variant = "primary",
  icon,
  className,
  disabled = false,
  loading = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  icon?: IconName;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const variants: Record<BtnVariant, string> = {
    primary: "bg-pine text-[#F4F8EE] hover:bg-pine-2",
    dark: "bg-shell-900 text-lime-glow hover:bg-shell-800 border border-shell-600",
    outline: "border border-cardline-2 bg-transparent text-ink hover:bg-card",
    ghost: "text-pine hover:bg-pine-soft/60",
    danger: "bg-danger-soft text-danger hover:bg-[#f0d4cc]",
    accent: "bg-lime-glow text-lime-ink hover:bg-lime-soft",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "flex items-center justify-center gap-2 rounded-[18px] px-5 py-3.5 text-[15px] font-bold transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        className
      )}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
      ) : (
        icon && <Icon name={icon} size={17} strokeWidth={2.4} />
      )}
      {children}
    </button>
  );
}

/* ----- Chips & fourchettes ----- */

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-field px-2.5 py-0.5 text-[11px] font-bold text-ink-2", className)}>
      {children}
    </span>
  );
}

/** Pilule "110–200 g" — n'affiche rien si la valeur est unique. */
export function RangePill({ range, unit, accent = false, className }: { range: NutriRange; unit?: string; accent?: boolean; className?: string }) {
  const sub = fmtRangeSub(range, unit);
  if (!sub) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold tnum",
        accent ? "bg-lime-glow text-lime-ink" : "bg-field text-mut",
        className
      )}
      title="Fourchette min–max renvoyée par l'API"
    >
      {sub}
    </span>
  );
}

/* ----- Jauges ----- */

export function MacroBar({
  label,
  range,
  goal,
  color,
  soft,
  unit = "g",
}: {
  label: string;
  range: NutriRange;
  goal: number;
  color: string;
  soft: string;
  unit?: string;
}) {
  const progress = pct(range.estimation, goal);
  const sub = fmtRangeSub(range, unit);
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-ink-2">{label}</span>
        <span className="tnum text-[13px] font-extrabold text-ink">
          {fmtEst(range)}
          <span className="font-semibold text-faint"> / {goal} {unit}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: soft }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress * 100}%`, backgroundColor: color }}
        />
      </div>
      {sub ? <div className="tnum mt-1 text-[11px] font-medium text-faint">Fourchette : {sub}</div> : null}
    </div>
  );
}

export function Ring({
  value,
  goal,
  size = 168,
  stroke = 14,
  children,
}: {
  value: number;
  goal: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = pct(value, goal);
  const over = value > goal;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-field)" strokeWidth={stroke} />
        <circle
          className="anim-ring"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? "var(--color-danger)" : "var(--color-pine)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * progress} ${c}`}
          style={{ ["--ring-c" as string]: `${c}` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ----- États ----- */

export function LoadingBlock({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3.5 py-14">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-pine-soft border-t-pine" />
      <p className="text-[13.5px] font-medium text-mut">{label}</p>
    </div>
  );
}

export function ErrorBlock({
  title,
  body,
  onRetry,
  offline = false,
}: {
  title: string;
  body: string;
  onRetry?: () => void;
  offline?: boolean;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <div
        className={cn(
          "mb-3 flex h-14 w-14 items-center justify-center rounded-full",
          offline ? "bg-warnbg text-warntext" : "bg-danger-soft text-danger"
        )}
      >
        <Icon name={offline ? "wifiOff" : "alert"} size={24} />
      </div>
      <p className="text-[16px] font-extrabold text-ink">{title}</p>
      <p className="mt-1 max-w-[270px] text-[13.5px] leading-5 text-mut">{body}</p>
      {onRetry ? (
        <Btn variant="outline" icon="refresh" onClick={onRetry} className="mt-4 !px-4 !py-2.5 text-[14px]">
          Réessayer
        </Btn>
      ) : null}
    </div>
  );
}

export function EmptyBlock({
  icon,
  title,
  text,
  actionTitle,
  onAction,
}: {
  icon: IconName;
  title: string;
  text: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-pine-soft text-pine">
        <Icon name={icon} size={23} />
      </div>
      <p className="text-[16px] font-extrabold text-ink">{title}</p>
      <p className="mt-1 max-w-[270px] text-[13.5px] leading-5 text-mut">{text}</p>
      {actionTitle && onAction ? (
        <Btn icon="arrow-right" onClick={onAction} className="mt-4">
          {actionTitle}
        </Btn>
      ) : null}
    </div>
  );
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "rounded-[24px] border border-cardline bg-card p-4 text-left",
        onClick && "w-full transition-all hover:border-cardline-2 hover:shadow-sm active:scale-[0.985]",
        className
      )}
    >
      {children}
    </Tag>
  );
}
