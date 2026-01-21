export function withHardTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timer: number;

  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = window.setTimeout(() => {
        reject(new Error(`Timeout (${label}) após ${ms}ms`));
      }, ms);
    }),
  ]).finally(() => clearTimeout(timer));
}
