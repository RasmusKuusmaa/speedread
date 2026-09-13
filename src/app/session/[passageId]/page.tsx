import { notFound } from "next/navigation";
import { loadPassages } from "@/lib/content/loader";
import { SessionReader } from "./session-reader";

export default async function SessionPage({
  params,
}: PageProps<"/session/[passageId]">) {
  const { passageId } = await params;
  const passage = loadPassages().find((item) => item.id === passageId);

  if (!passage) {
    notFound();
  }

  return <SessionReader passage={passage} />;
}
