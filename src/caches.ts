// eslint-disable-next-line @typescript-eslint/no-shadow
import { Cache } from './interfaces.js';

export abstract class ArrayCache<T> implements Cache<T> {
    protected _payloads: T[] = [];
    public abstract add(value: T): void;

    public forEach(callback: (value: T) => void): void {
        this._payloads.forEach((value) => callback(value));
    }

    public clear(): void {
        this._payloads.length = 0;
    }
}

/**
 * Holds exactly one payload.
 * Late listeners will get the very last payload.
 */
export class ValueCache<T> extends ArrayCache<T> {
    public readonly kind = 'valueCache';
    public add(value: T): void {
        this._payloads = [value];
    }
}

/**
 * Holds all payloads up to a given capacity.
 * Late listeners will get at max the `capacity` latest payloads.
 */
export class CapacityCollectionCache<T> implements Cache<T> {
    private _payloads: T[] = [];

    public readonly kind = 'capacityCache';

    constructor(private readonly _capacity: number) {
        if (_capacity <= 0) {
            throw new Error(`constructing a cache with a capacity of ${_capacity} makes no sense`);
        }
    }

    public add(value: T): void {
        this._payloads = [...this._payloads.slice(-this._capacity + 1), value];
    }

    public forEach(callback: (value: T) => void): void {
        for (const value of this._payloads) {
            callback(value);
        }
    }
}

/**
 * Holds all payloads.
 * Late listeners will get all previous payloads.
 */
export class CollectionCache<T> extends ArrayCache<T> {
    public readonly kind = 'collectionCache';

    public static withCapacity<T>(capacity: number): CapacityCollectionCache<T> {
        return new CapacityCollectionCache(capacity);
    }

    public add(value: T): void {
        this._payloads.push(value);
    }
}

/**
 * Holds all payloads grouped by a certain predicate.
 * Late listeners will receive the latest payload from each of these categories.
 */
export class GroupingCache<T, G> implements Cache<T> {
    private readonly _payloads = new Map<G, T>();

    public readonly kind = 'groupingCache';

    public static byProperty<T>(
        groupPredicate: (payload: T) => T[keyof T]
    ): GroupingCache<T, T[keyof T]> {
        return new GroupingCache(groupPredicate);
    }

    constructor(private readonly _groupPredicate: (payload: T) => G) {}

    public add(payload: T): void {
        const group = this._groupPredicate(payload);
        this._payloads.set(group, payload);
    }

    public forEach(callback: (payload: T) => void): void {
        for (const payload of this._payloads.values()) {
            callback(payload);
        }
    }
}
