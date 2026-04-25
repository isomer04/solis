/**
 * Safely extracts a human-readable message from an unknown thrown value.
 *
 * Use this in every catch block instead of `(err as Error).message`.
 * TypeScript's `catch (err)` gives `err: unknown`, so casting directly
 * with `as Error` is unsafe — err could be a string, number, or non-Error object.
 *
 * @example
 * } catch (err) {
 *   setError(getErrorMessage(err));
 * }
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "An unexpected error occurred";
}
