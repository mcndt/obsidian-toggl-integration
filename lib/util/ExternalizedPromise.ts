/**
 * Instantiates a promise with externalized resolve and reject functions.
 * @returns An array containing of:
 *  - A promise of type T
 *  - A function with parameter T which resolves the promise.
 *  - A function which rejects the promise.
 */
export default function externalizedPromise<T>(): [
  Promise<T>,
  (value: T) => void,
  (reason: any) => void,
] {
  let external_resolve, external_reject;
  const promise = new Promise<T>(function (resolve, reject) {
    external_resolve = resolve;
    external_reject = reject;
  });
  return [promise, external_resolve, external_reject];
}
