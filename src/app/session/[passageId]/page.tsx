import { notFound } from "next/navigation";
import { loadPassages } from "@/lib/content/loader";
import { SessionReader } from "./session-reader";
import type { SessionContext } from "./types";

const SESSION_CONTEXTS: SessionContext[] = [
  "practice",
  "retest",
  "calibration",
];

export default async function SessionPage({
  params,
  searchParams,
}: PageProps<"/session/[passageId]">) {
  const { passageId } = await params;
  const { context } = await searchParams;
  const passage = loadPassages().find((item) => item.id === passageId);

  if (!passage) {
    notFound();
  }

  const requestedContext = Array.isArray(context) ? context[0] : context;
  const sessionContext = SESSION_CONTEXTS.includes(
    requestedContext as SessionContext,
  )
    ? (requestedContext as SessionContext)
    : "practice";

  return <SessionReader passage={passage} sessionContext={sessionContext} />;
}
