export function debugLog(description: string): void {
  console.log(`[${new Date().toISOString()}] ${description}`);
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
