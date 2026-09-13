import { notFound } from "next/navigation";
import { loadPassages } from "@/lib/content/loader";
import { SessionReader } from "./session-reader";
import type { SessionContext, SessionMode } from "@/lib/storage/types";

const SESSION_CONTEXTS: SessionContext[] = [
  "practice",
  "retest",
  "calibration",
];

const SESSION_MODES: SessionMode[] = ["self-paced", "paced"];

export default async function SessionPage({
  params,
  searchParams,
}: PageProps<"/session/[passageId]">) {
  const { passageId } = await params;
  const { context, mode, retestId } = await searchParams;
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

  const requestedMode = Array.isArray(mode) ? mode[0] : mode;
  const sessionMode = SESSION_MODES.includes(requestedMode as SessionMode)
    ? (requestedMode as SessionMode)
    : "self-paced";

  const requestedRetestId = Array.isArray(retestId) ? retestId[0] : retestId;

  return (
    <SessionReader
      passage={passage}
      sessionContext={sessionContext}
      mode={sessionMode}
      retestId={requestedRetestId ?? null}
    />
  );
}
