import { redirect } from "next/navigation";
import { BookIcon } from "@/components/book-icon";
import { hasValidSession } from "@/lib/auth";
import { getAuthConfigProblems } from "@/lib/config";
import { PinForm } from "./pin-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await hasValidSession()) redirect("/");

  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : "/";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pt-16 pb-7">
      <main className="flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <div className="flex size-[88px] items-center justify-center rounded-3xl bg-accent-soft text-accent">
            <BookIcon />
          </div>
          <div className="flex flex-col gap-2.5">
            <h1 className="font-serif text-[30px] leading-tight font-semibold tracking-[-0.01em]">
              Business English
            </h1>
            <p className="text-base leading-normal text-muted">
              Тренажёр бизнес-английского. Введите PIN-код, чтобы продолжить.
            </p>
          </div>
        </div>

        <PinForm next={nextPath} configProblems={getAuthConfigProblems()} />
      </main>
    </div>
  );
}
