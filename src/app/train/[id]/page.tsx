import { notFound } from "next/navigation";
import { getAi } from "@/lib/ai";
import { requireSession } from "@/lib/auth";
import { firstLettersHint } from "@/lib/hints";
import { getSession, isFinished } from "@/lib/training";
import { getWord } from "@/lib/words";
import { Summary } from "./summary";
import { TrainingScreen } from "./training-screen";

// Тренировка (US-4): текущая фраза или итог сессии.
export default async function TrainingPage({ params }: PageProps<"/train/[id]">) {
  await requireSession();
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();

  if (isFinished(session)) return <Summary session={session} />;

  const index = session.current_index;
  const phrase = session.phrases[index];
  const word = await getWord(phrase.word_id);
  const term = word?.term ?? phrase.reference;

  return (
    <TrainingScreen
      key={index}
      sessionId={session.id}
      index={index}
      total={session.phrases.length}
      promptRu={phrase.prompt_ru}
      term={term}
      firstLetters={firstLettersHint(term)}
      isStub={getAi().isStub}
    />
  );
}
