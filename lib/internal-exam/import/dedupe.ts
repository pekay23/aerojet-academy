export function questionHash(text: string, options: string[]): string {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()
  const sorted = [...options].sort()
  return `${normalized}:${JSON.stringify(sorted)}`
}

export function computeDuplicateCount(
  questions: Array<{ text: string; options: string[] }>,
  existingHashes: Set<string>
): number {
  return questions.filter((q) => existingHashes.has(questionHash(q.text, q.options))).length
}
