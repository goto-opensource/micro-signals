export type Listener<T> = (payload: T) => void;

export interface BaseSignal<T> {
    add(listener: Listener<T>): void;
    remove(listener: Listener<T>): void;
}

export interface ReadableSignal<T> extends BaseSignal<T> {
    addOnce(listener: Listener<T>): void;
    filter(filter: (payload: T) => boolean): ReadableSignal<T>;
    map<U>(transform: (payload: T) => U): ReadableSignal<U>;
    merge<U>(...signals: ReadableSignal<U>[]): ReadableSignal<T|U>;
    promisify(rejectSignal?: ReadableSignal<any>): Promise<T>;
    readOnly(): ReadableSignal<T>;
    cache(cache: Cache<T>): ReadableSignal<T>;
}

// TODO Writable should only be writable
export interface WritableSignal<T> extends ReadableSignal<T> {
    dispatch: (payload: T) => void;
}

export interface Cache<T> {
    add(payload: T): void;
    forEach(callback: (payload: T) => void): void;
}
