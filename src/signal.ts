import { ExtendedSignal } from './extended-signal.js';
import { ReadableSignal } from './index.js';
import { Listener, WritableSignal } from './interfaces.js';

export class Signal<T> extends ExtendedSignal<T> implements WritableSignal<T>, ReadableSignal<T> {
    protected _listeners = new Set<Listener<T>>();

    public static setDefaultListener(listener: Listener<any>) {
        Signal._staticDefaultListener = listener;
    }

    private static _staticDefaultListener: Listener<any> = () => {
        // default static listener is a noop
    };

    constructor() {
        super({
            add: (listener) => {
                this._listeners.add(listener);
            },
            remove: (listener) => {
                this._listeners.delete(listener);
            },
        });
    }

    public dispatch(payload: T): void {
        if (this._listeners.size === 0) {
            const instanceDefaultListener = this._instanceDefaultListener;
            instanceDefaultListener(payload);
            return;
        }

        this._listeners.forEach((callback) => callback.call(undefined, payload));
    }

    public setDefaultListener(listener: Listener<T>) {
        this._instanceDefaultListener = listener;
    }

    public clear() {
        this._parentPostClearHooks.forEach((hook) => hook());
        this._parentPostClearHooks.length = 0;
        this._listeners = new Set();
    }

    private _instanceDefaultListener: Listener<T> = (payload) =>
        Signal._staticDefaultListener(payload);
}
