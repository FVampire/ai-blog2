/** Bound requests even if an SDK fails to settle when its signal is aborted. */
export function abortable<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const aborted = () => reject(new Error("请求已取消或超时"));
    if (signal.aborted) {
      promise.catch(() => {});
      aborted();
      return;
    }
    signal.addEventListener("abort", aborted, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", aborted));
  });
}

export function requestScope(
  parent: AbortSignal | undefined,
  milliseconds: number,
) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  parent?.addEventListener("abort", abort, { once: true });
  if (parent?.aborted) abort();
  const timer = setTimeout(abort, milliseconds);
  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      parent?.removeEventListener("abort", abort);
    },
  };
}

export function isReadOnlyTool(metadata?: Record<string, unknown>): boolean {
  const annotations = metadata?.annotations;
  return (
    !!annotations &&
    typeof annotations === "object" &&
    "readOnlyHint" in annotations &&
    annotations.readOnlyHint === true &&
    (!("destructiveHint" in annotations) ||
      annotations.destructiveHint !== true)
  );
}
