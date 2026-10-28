export function formatAuthError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected authentication error occurred.";
}

export function isUserCancellation(error: unknown): boolean {
  const msg = formatAuthError(error).toLowerCase();
  if (!msg) {
    return false;
  }
  return (
    msg.includes("cancel") ||
    msg.includes("closed") ||
    msg.includes("denied") ||
    msg.includes("abort")
  );
}
