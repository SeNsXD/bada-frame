interface RequestQueueItem {
    request: (canceller?: RequestCanceller) => Promise<any>;
    callback: (response) => void;
    isCanceled: { status: boolean };
    canceller: { exec: () => void };
}

export interface RequestCanceller {
    exec: () => void;
}
export interface QueueUpResponse<T> {
    promise: Promise<T>;
    canceller: RequestCanceller;
}

export default class QueueProcessor<T> {
    private requestQueue: RequestQueueItem[] = [];

    private requestInProcessing = 0;

    constructor(private maxParallelProcesses: number) {}

    public queueUpRequest(
        request: (canceller?: RequestCanceller) => Promise<T>
    ): QueueUpResponse<T> {
        const isCanceled = { status: false };
        const canceller: RequestCanceller = {
            exec: () => {
                isCanceled.status = true;
            },
        };

        const promise = new Promise<T>((resolve) => {
            this.requestQueue.push({
                request,
                callback: resolve,
                isCanceled,
                canceller,
            });
            this.pollQueue();
        });

        return { promise, canceller };
    }

    async pollQueue() {
        if (this.requestInProcessing < this.maxParallelProcesses) {
            this.requestInProcessing++;
            await this.processQueue();
            this.requestInProcessing--;
        }
    }

    public async processQueue() {
        while (this.requestQueue.length > 0) {
            const queueItem = this.requestQueue.pop();
            let response: any;
            if (queueItem.isCanceled.status) {
                response = null;
            } else {
                try {
                    response = await queueItem.request(queueItem.canceller);
                } catch (e) {
                    // ignore
                }
            }
            queueItem.callback(response);
        }
    }
}
