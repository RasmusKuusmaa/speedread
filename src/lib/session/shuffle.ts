export function createSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedForQuestion(
  sessionSeed: number,
  questionId: string,
): number {
  let hash = sessionSeed | 0;
  for (let i = 0; i < questionId.length; i++) {
    hash = (Math.imul(hash, 31) + questionId.charCodeAt(i)) | 0;
  }
  return hash;
}

export function shuffledOrder(length: number, seed: number): number[] {
  const order = Array.from({ length }, (_, index) => index);
  const random = mulberry32(seed);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = order[i]!;
    order[i] = order[j]!;
    order[j] = temp;
  }
  return order;
}
