import test from 'tape';

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

test('Signal#cached adding a listener to a derived signal should receive the cache', (t) => {
    const signal = new Signal<number>();
    const receivedPayloads: string[] = [];

    const cachedSignal = signal.cache(testCache([1, 2, 3]));

    const mappedSignal = cachedSignal.map((x) => x.toString(10));

    mappedSignal.add((payload) => receivedPayloads.push(payload));

    t.deepEqual(receivedPayloads, ['1', '2', '3']);
    t.end();
});

cacheSuite(ValueCache, (arr) => arr.slice(-1));

cacheSuite(CollectionCache, (arr) => arr);
