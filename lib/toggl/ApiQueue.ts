import externalizedPromise from "lib/util/ExternalizedPromise";

export type Queueable<T> = () => Promise<T>;

type QueueItem<T> = {
  promiseFunc: Queueable<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
};

export class ApiQueue {
  private _queue: QueueItem<any>[] = [];
  private _busy = false;

  /**
   * Adds a promise to the queue.
   * @param func A function that returns a promise to be queued for execution.
   * @returns A promise that resolves when the given function's promise resolves.
   */
  public queue<T>(func: Queueable<T>): Promise<T> {
    const [promise, resolve, reject] = externalizedPromise<T>();

    if (this._busy) {
      console.debug("Queueing Toggl API query");
    }

    this._queue.push({ promiseFunc: func, reject, resolve });

    this.checkQueue();
    return promise;
  }

  /**
   * Executes the next promise in the queue.
   */
  private async _executeNext() {
    const item = this._queue.shift();
    if (item) {
      this._busy = true;
      return item
        .promiseFunc()
        .then((val) => {
          item.resolve(val);
          this._busy = false;
          this.checkQueue();
        })
        .catch(item.reject);
    }
  }

  private checkQueue() {
    if (this._queue.length > 0 && !this._busy) {
      this._executeNext();
    }
  }
}
