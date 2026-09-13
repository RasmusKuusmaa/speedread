import { notFound } from "next/navigation";
import { loadPassages } from "@/lib/content/loader";

export default async function SessionPage({
  params,
}: PageProps<"/session/[passageId]">) {
  const { passageId } = await params;
  const passage = loadPassages().find((item) => item.id === passageId);

  if (!passage) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col py-16">
      <article className="mx-auto flex max-w-[66ch] flex-col gap-6 font-serif text-[19px] leading-[1.65] text-ink">
        {passage.body.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>
    </main>
  );
}
