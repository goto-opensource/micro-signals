import test from 'tape';

import { CapacityCollectionCache, GroupingCache } from '../src/caches.js';
// eslint-disable-next-line @typescript-eslint/no-shadow
import { Cache, CollectionCache, Signal, ValueCache } from '../src/index.js';

import { cacheSuite } from './suites/cache-suite.js';

// testValues should contain at least 4 items as some tests expect to slice at certain points
const testValues = Object.freeze([0, 2, 4, Infinity, 1, -4, 49, 0]);

function testCache<T>(values: ReadonlyArray<T>): Cache<T> {
    return {
        add() {
            /* not used */
        },
        forEach(callback) {
            values.forEach((value) => callback(value));
        },
    };
}

test('Signal#cache readme', (t) => {
    const signal = new Signal<string>();
    const valueCached = signal.cache(new ValueCache());
    const collectionCached = signal.cache(new CollectionCache());

    const valueCachedReceived: string[] = [];
    const collectionCachedReceived: string[] = [];

    ['a', 'b', 'c'].forEach((payload) => signal.dispatch(payload));

    valueCached.add((payload) => valueCachedReceived.push(payload));
    collectionCached.add((payload) => collectionCachedReceived.push(payload));

    ['d', 'e'].forEach((payload) => signal.dispatch(payload));

    t.deepEqual(valueCachedReceived, ['c', 'd', 'e']);
    t.deepEqual(collectionCachedReceived, ['a', 'b', 'c', 'd', 'e']);
    t.end();
});

test('Signal#cache calling dispatch on the source signal calls add on the cache', (t) => {
    const signal = new Signal<number>();
    const receivedPayloads: number[] = [];

    signal.cache({
        add(payload) {
            receivedPayloads.push(payload);
        },
        forEach() {
            /* not used */
        },
    });

    testValues.forEach((value) => signal.dispatch(value));

    t.deepEqual(receivedPayloads, testValues);
    t.end();
});

test('Signal#cache calling add on the cached signal dispatches values provided by the cache', (t) => {
    const signal = new Signal<number>();
    const receivedPayloads: number[] = [];

    const cachedSignal = signal.cache(testCache(testValues));

    cachedSignal.add((payload) => receivedPayloads.push(payload));

    t.deepEqual(receivedPayloads, testValues);
    t.end();
});

test('Signal#cache addOnce on the cached signal dispatches values provided by the cache once', (t) => {
    const signal = new Signal<number>();
    const receivedPayloads: number[] = [];

    const cachedSignal = signal.cache(testCache(testValues));

    cachedSignal.addOnce((payload) => receivedPayloads.push(payload));

    t.deepEqual(receivedPayloads, testValues.slice(0, 1));
    t.end();
});

test('Signal#cache should provide a signal that receives cached and new payloads', (t) => {
    const signal = new Signal<number>();
    const receivedPayloads: number[] = [];

    const cachedSignal = signal.cache(testCache(testValues.slice(0, 2)));

    cachedSignal.add((payload) => receivedPayloads.push(payload));

    testValues.slice(2).forEach((value) => signal.dispatch(value));

    t.deepEqual(receivedPayloads, testValues);
    t.end();
});

test('Signal#cache should provide a signal that allows removing during cache replay', (t) => {
    const signal = new Signal<number>();
    const receivedPayloads: number[] = [];

    const cachedSignal = signal.cache(testCache(testValues));

    const listener = (payload: number) => {
        receivedPayloads.push(payload);
        if (receivedPayloads.length === 2) {
            cachedSignal.remove(listener);
        }
    };

    cachedSignal.add(listener);

    t.deepEqual(receivedPayloads, testValues.slice(0, 2));
    t.end();
});

test('Signal#cache adding a listener to a derived signal should receive the cache', (t) => {
    const signal = new Signal<number>();
    const receivedPayloads: string[] = [];

    const cachedSignal = signal.cache(testCache([1, 2, 3]));

    const mappedSignal = cachedSignal.map((x) => x.toString(10));

    mappedSignal.add((payload) => receivedPayloads.push(payload));

    t.deepEqual(receivedPayloads, ['1', '2', '3']);
    t.end();
});

test('Signal#cache adding a FreshListener to a derived signal should NOT receive the cache', (t) => {
    const signal = new Signal<number>();
    const receivedPayloads: string[] = [];

    const cachedSignal = signal.cache(testCache([1, 2, 3]));

    const mappedSignal = cachedSignal.map((x) => x.toString(10));
    const filteredSignal = mappedSignal.filter((_x) => true);
    const peekedSignal = filteredSignal.peek((x) => void x);

    mappedSignal.addFresh((payload) => receivedPayloads.push(payload));
    filteredSignal.addFresh((payload) => receivedPayloads.push(payload));
    peekedSignal.addFresh((payload) => receivedPayloads.push(payload));

    t.deepEqual(receivedPayloads, [], 'did not receive anything');
    signal.dispatch(42);
    t.deepEqual(receivedPayloads, ['42', '42', '42'], 'received new values');
    t.end();
});

test('Signal#cache removed FreshListeners should NOT receive future payloads', (t) => {
    const signal = new Signal<string>();
    const receivedPayloads: string[] = [];

    const cachedSignal = signal.cache();
    const listener = (payload: string) => receivedPayloads.push(payload);
    cachedSignal.addFresh(listener);
    cachedSignal.remove(listener);

    signal.dispatch('one');
    t.deepEqual(receivedPayloads, [], 'did not receive anything');
    t.end();
});

test('Signal#cache removed (with tag) FreshListeners should NOT receive future payloads', (t) => {
    const signal = new Signal<string>();
    const receivedPayloads: string[] = [];

    const tag = {};
    const cachedSignal = signal.cache();
    const listener = (payload: string) => receivedPayloads.push(payload);
    cachedSignal.addFresh(listener, tag);
    cachedSignal.remove(tag);

    signal.dispatch('one');
    t.deepEqual(receivedPayloads, [], 'did not receive anything');
    t.end();
});

test(`Signal#cache subscribers don't get cache after clearing`, (t) => {
    const signal = new Signal<number>();
    const cached = signal.cache(new CollectionCache<number>());

    const dispatchedValues: number[] = [];
    const tooLateSubscriber = (value: number) => dispatchedValues.push(value + 100);

    [1, 2, 3, 4, 5].forEach((value) => signal.dispatch(value));

    signal.clear();

    cached.add(tooLateSubscriber);

    t.deepEqual(dispatchedValues, []);
    t.end();
});

test(`Signal#cache subscribers of derived Signals don't get cache after clearing`, (t) => {
    const signal = new Signal<number>();
    const cached = signal.readOnly().cache(new CollectionCache<number>());

    const dispatchedValues: number[] = [];
    const tooLateSubscriber = (value: number) => dispatchedValues.push(value + 100);

    [1, 2, 3, 4, 5].forEach((value) => signal.dispatch(value));

    signal.clear();

    cached.add(tooLateSubscriber);

    t.deepEqual(dispatchedValues, []);
    t.end();
});

test(`Signal#cache new caches can be created after clearing`, (t) => {
    const signal = new Signal<number>();

    const dispatchedValues: number[] = [];

    signal.clear(); // wiping old cache

    const lateSubscriber = (value: number) => dispatchedValues.push(value + 10);
    const cached = signal.cache(new CollectionCache<number>());

    [6, 7, 8, 9, 0].forEach((value) => signal.dispatch(value));
    cached.add(lateSubscriber);

    t.deepEqual(dispatchedValues, [16, 17, 18, 19, 10]);
    t.end();
});

test(`cache is cleared with the signal`, (t) => {
    const signal = new Signal<number>();

    const dispatchedValues: number[] = [];
    const dispatchedValues2: number[] = [];

    const lateSubscriber = (value: number) => dispatchedValues.push(value + 10);
    const lateSubscriber2 = (value: number) => dispatchedValues2.push(value + 10);
    const cache = new CollectionCache<number>();
    const cached = signal.cache(cache);

    [6, 7, 8, 9, 0].forEach((value) => signal.dispatch(value));
    cached.add(lateSubscriber);
    signal.clear();

    const cachedValues: number[] = [];
    cache.forEach((value) => cachedValues.push(value));

    cached.add(lateSubscriber2);

    t.deepEqual(cachedValues, [], 'cache should be empty');
    t.end();
});

cacheSuite(
    () => new ValueCache(),
    (arr) => arr.slice(-1)
);

cacheSuite(
    () => new CollectionCache(),
    (arr) => arr
);

cacheSuite(
    () => new CapacityCollectionCache(100),
    (arr) => arr
);

cacheSuite(
    // FIXME: NOOO!
    () => new GroupingCache((_payload) => Math.random() as any),
    (arr) => arr
);
