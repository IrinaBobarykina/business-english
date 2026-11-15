import Link from "next/link";
import type { ReactNode } from "react";

// Общие элементы интерфейса в стиле прототипа v0.1.

export const buttonPrimary =
  "flex h-[52px] items-center justify-center gap-2 rounded-xl bg-accent px-5 text-base font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50";
export const buttonSecondary =
  "flex h-[52px] items-center justify-center gap-2 rounded-xl border border-line-strong bg-white px-5 text-base font-medium text-ink transition-colors hover:border-ink/40 disabled:cursor-not-allowed disabled:opacity-50";
export const inputBase =
  "w-full rounded-xl border border-line-strong bg-white px-3.5 text-base text-ink placeholder:text-muted/70";

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">{children}</div>;
}

export function BackLink({ href = "/", children = "Мои слова" }: { href?: string; children?: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center gap-1.5 self-start text-[15px] font-medium text-accent hover:text-accent-hover"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" />
      </svg>
      {children}
    </Link>
  );
}

export function PlusIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ErrorBox({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div id={id} role="alert" className="flex gap-3 rounded-[14px] bg-warn-bg p-4 text-warn-ink">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-px shrink-0">
        <path d="M12 3l9.5 17h-19z" />
        <path d="M12 10v4M12 17.5v.5" />
      </svg>
      <div className="text-[15px] leading-[1.45] font-medium">{children}</div>
    </div>
  );
}
