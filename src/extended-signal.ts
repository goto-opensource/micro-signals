import {
    Accumulator,
    BaseSignal,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    Cache,
    Listener,
    ReadableSignal,
    WritableSignal,
} from './interfaces.js';
import { Signal } from './signal.js';
import { TagMap } from './tag-map.js';

export class ExtendedSignal<T> implements ReadableSignal<T> {
    private _tagMap = new TagMap<T>();
    protected _postClearHooks: Function[] = [];

    public static merge<U>(...signals: BaseSignal<U>[]): ReadableSignal<U> {
        const listeners = new Map<any, any>();
        return new ExtendedSignal({
            add(listener) {
                const newListener = (payload: U) => listener(payload);
                listeners.set(listener, newListener);
                signals.forEach((signal) => signal.add(newListener));
            },
            remove(listener) {
                const newListener = listeners.get(listener);
                listeners.delete(listener);
                signals.forEach((signal) => signal.remove(newListener));
            },
        });
    }

    public static promisify<U>(
        resolveSignal: BaseSignal<U>,
        rejectSignal?: BaseSignal<any>
    ): Promise<U> {
        return new Promise<U>((resolve, reject) => {
            function clearListeners() {
                resolveSignal.remove(completeResolution);
                if (rejectSignal) {
                    rejectSignal.remove(completeRejection);
                }
            }

            function completeRejection(payload: any) {
                clearListeners();
                reject(payload);
            }

            function completeResolution(payload: U) {
                clearListeners();
                resolve(payload);
            }

            resolveSignal.add(completeResolution);
            if (rejectSignal) {
                rejectSignal.add(completeRejection);
            }
        });
    }

    constructor(private readonly _baseSignal: BaseSignal<T>) {}

    public add(listener: Listener<T>, ...tags: any[]): void {
        this._tagMap.setListeners(listener, ...tags);
        this._baseSignal.add(listener);
    }

    public remove(listenerOrTag: any): void {
        this._tagMap.getListeners(listenerOrTag).forEach((taggedListener) => {
            this._baseSignal.remove(taggedListener);
            this._tagMap.clearListener(taggedListener);
        });
        this._baseSignal.remove(listenerOrTag);
        this._tagMap.clearListener(listenerOrTag);
    }

    public chain(
        child?: ReadableSignal<any> & WritableSignal<any>
    ): ReadableSignal<T> & WritableSignal<T> {
        const newChild = child ?? new Signal<T>();
        this.add((payload) => newChild.dispatch(payload), child);
        return newChild;
    }

    public addOnce(listener: Listener<T>, ...tags: any[]): void {
        // to match the set behavior of add, only add the listener if the listener is not already
        // registered, don't add the same listener twice
        if (this._tagMap.getListeners(listener).size > 0) {
            return;
        }
        const oneTimeListener = (payload: T) => {
            this._baseSignal.remove(oneTimeListener);
            this._tagMap.clearListener(oneTimeListener);
            listener(payload);
        };
        this._tagMap.setListeners(oneTimeListener, listener, ...tags);
        this._baseSignal.add(oneTimeListener);
    }

    public filter<U extends T>(filter: (payload: T) => payload is U): ReadableSignal<U>;
    public filter(filter: (payload: T) => boolean): ReadableSignal<T>;
    public filter(filter: (payload: T) => boolean): ReadableSignal<T> {
        return convertedListenerSignal(this._baseSignal, (listener) => (payload) => {
            if (filter(payload)) {
                listener(payload);
            }
        });
    }

    public map<U>(transform: (payload: T) => U): ReadableSignal<U> {
        return convertedListenerSignal(
            this._baseSignal,
            (listener) => (payload) => listener(transform(payload))
        );
    }

    public merge<U>(...signals: BaseSignal<U>[]): ReadableSignal<T | U> {
        return ExtendedSignal.merge<T | U>(this._baseSignal, ...signals);
    }

    public promisify(rejectSignal?: ReadableSignal<any>): Promise<T> {
        return ExtendedSignal.promisify(this._baseSignal, rejectSignal);
    }

    public readOnly(): ReadableSignal<T> {
        return convertedListenerSignal(
            this._baseSignal,
            (listener) => (payload) => listener(payload)
        );
    }

    public reduce<U>(accumulator: Accumulator<T, U>, initialValue: U): ReadableSignal<U> {
        return convertedListenerSignal(this._baseSignal, (listener) =>
            (() => {
                let accumulated = initialValue;
                return (payload: T) => {
                    accumulated = accumulator(accumulated, payload);
                    listener(accumulated);
                };
            })()
        );
    }

    public peek(peekaboo: (payload: T) => void): ReadableSignal<T> {
        return convertedListenerSignal(this._baseSignal, (listener) => (payload) => {
            peekaboo(payload);
            listener(payload);
        });
    }

    /**
     * cached Signals clear will not dispatch cached payloads after being cleared
     */
    public cache(cache: Cache<T>): ReadableSignal<T> {
        let alive = true;
        const writeToCache = (payload: T) => cache.add(payload);
        this._baseSignal.add(writeToCache);
        this._postClearHooks.push(() => {
            alive = false;
            this._baseSignal.remove(writeToCache);
        });

        return convertedListenerSignal(
            this._baseSignal,
            (listener) => (payload) => listener(payload),
            (listener, listenerActive) => {
                cache.forEach((payload) => {
                    if (alive && listenerActive()) {
                        listener(payload);
                    }
                });
            }
        );
    }
}

/**
 * Provides a new signal, with its own set of listeners, and the ability to transform listeners that
 * are added to the new signal.
 */
function convertedListenerSignal<BaseType, ExtendedType>(
    baseSignal: BaseSignal<BaseType>,
    convertListener: (listener: Listener<ExtendedType>) => Listener<BaseType>,
    postAddHook?: (listener: Listener<ExtendedType>, listenerActive: () => boolean) => void
): ExtendedSignal<ExtendedType> {
    const listenerMap = new Map<Listener<ExtendedType>, Listener<BaseType>>();
    return new ExtendedSignal({
        add: (listener) => {
            const newListener = convertListener(listener);
            listenerMap.set(listener, newListener);
            baseSignal.add(newListener);
            if (postAddHook) {
                postAddHook(listener, () => listenerMap.has(listener));
            }
        },
        remove: (listener) => {
            const newListener = listenerMap.get(listener);
            listenerMap.delete(listener);
            // TODO undefined ok in other case
            if (newListener !== undefined) {
                baseSignal.remove(newListener);
            }
        },
    });
}
