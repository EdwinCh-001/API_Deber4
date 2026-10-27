export const MAX_NOTE_WORDS = 60;

export function countWords(note: string): number {
  const trimmedNote = note.trim();
  return trimmedNote ? trimmedNote.split(/\s+/u).length : 0;
}

export function getNoteValidationError(note: string): string | null {
  if (!note.trim()) {
    return "La nota es obligatoria.";
  }

  const wordCount = countWords(note);
  if (wordCount > MAX_NOTE_WORDS) {
    return `La nota admite máximo ${MAX_NOTE_WORDS} palabras (actualmente: ${wordCount}).`;
  }

  return null;
}
