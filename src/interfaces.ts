import { CollectionCache, ValueCache } from './caches.js';

export type Listener<T> = (payload: T) => void;

export interface BaseSignal<T> {
    add(listener: Listener<T>, ...tags: any[]): void;
    remove(listenerOrTag: any): void;
}

export interface ReadableSignal<T> extends BaseSignal<T> {
    addOnce(listener: Listener<T>, ...tags: any[]): void;
    addFresh(listener: Listener<T>, ...tags: any[]): void;

    chain(child?: ReadableSignal<unknown> & WritableSignal<unknown>): ReadableSignal<T>;
    filter<U extends T>(filter: (payload: T) => payload is U): ReadableSignal<U>;
    filter(filter: (payload: T) => boolean): ReadableSignal<T>;
    map<U>(transform: (payload: T) => U): ReadableSignal<U>;
    merge<U, C extends Cache<unknown>>(...signals: CachedSignal<U, C>[]): CachedSignal<T | U, C>;
    merge<U>(...signals: ReadableSignal<U>[]): ReadableSignal<T | U>;
    promisify(rejectSignal?: ReadableSignal<any>): Promise<T>;
    peek(peekaboo: (payload: T) => void): ReadableSignal<T>;
    readOnly(): ReadableSignal<T>;

    cache(cache: ValueCache<T>): CachedSignal<T, ValueCache<T>>;
    cache(cache: CollectionCache<T>): CachedSignal<T, CollectionCache<T>>;
    cache<NC extends Cache<T>>(cache: NC): CachedSignal<T, NC>;

    reduce<U>(accumulator: Accumulator<T, U>, initialValue: U): ReadableSignal<U>;
}

export interface CachedSignal<T, C extends Cache<unknown> = ValueCache<T>> extends BaseSignal<T> {
    /**
     * @internal this tag is not used anywhere,
     * it's only there so that the interfaces are not recombined by typescript,
     * dont remove
     */
    readonly _phantom_cache_: C;

    addOnce(listener: Listener<T>, ...tags: any[]): void;
    addFresh(listener: Listener<T>, ...tags: any[]): void;

    chain(child?: ReadableSignal<unknown> & WritableSignal<unknown>): CachedSignal<T, C>;
    filter<U extends T>(filter: (payload: T) => payload is U): CachedSignal<U, C>;
    filter(filter: (payload: T) => boolean): CachedSignal<T, C>;
    map<U>(transform: (payload: T) => U): CachedSignal<U, C>;
    merge<U, UC extends Cache<U>>(...signals: CachedSignal<U, UC>[]): CachedSignal<T | U, UC | C>;
    merge<U>(...signals: ReadableSignal<U>[]): CachedSignal<T | U, C>;
    promisify(rejectSignal?: ReadableSignal<any>): Promise<T>;
    peek(peekaboo: (payload: T) => void): CachedSignal<T, C>;
    readOnly(): CachedSignal<T, C>;
    /**
     * @deprecated Please try to avoid caching an already cached signal.
     */
    cache<NC extends Cache<T>>(cache: NC): CachedSignal<T, NC>;
    reduce<U>(accumulator: Accumulator<T, U>, initialValue: U): CachedSignal<U, C>;
}

export interface WritableSignal<T> {
    dispatch: (payload: T) => void;
    /**
     * set a listener to be called if no other listeners are available.
     */
    setDefaultListener(listener: Listener<T>): void;

    /**
     * deletes all listeners
     */
    clear(): void;
}

export interface Cache<T = unknown> {
    add(payload: T): void;
    forEach(callback: (payload: T) => void): void;
}

export type Accumulator<T, U> = (accumulator: U, current: T) => any;

export type PayloadOf<S extends BaseSignal<any>> = S extends BaseSignal<infer T> ? T : never;

export type ReadOnlyVersionOf<S extends BaseSignal<any>> =
    S extends BaseSignal<infer T> ? ReadableSignal<T> : never;
