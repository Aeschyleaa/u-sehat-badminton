export function extractNames(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.replace(/^\s*\d+\.?\)?\s*/,'').trim())
    .filter((line) => line.length > 0)
}

