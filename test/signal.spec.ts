import test from 'tape';

import { ReadableSignal, Signal } from '../src/index.js';

import { LeakDetectionSignal } from './lib/leak-detection-signal.js';
import { derivedSuite } from './suites/derived-suite.js';
import { filteredSuite } from './suites/filtered-suite.js';
import { mappedSuite } from './suites/mapped-suite.js';
import { mergedSuite } from './suites/merged-suite.js';
import { peekedSuite } from './suites/peeked-suite.js';
import { promisifySuite } from './suites/promisify-suite.js';
import { readOnlySuite } from './suites/read-only-suite.js';
import { reducedSuite } from './suites/reduced-suite.js';

// TODO run the signal suite on the converted signals as well?

derivedSuite('derived Signal (filter)', (baseSignal) => baseSignal.filter((_x) => true));
derivedSuite('derived Signal (map)', (baseSignal) => baseSignal.map((x) => x));
derivedSuite('derived Signal (peek)', (baseSignal) => baseSignal.peek((x) => x));
derivedSuite('derived Signal (readonly)', (baseSignal) => baseSignal.readOnly());
// cannot turn this on for cached, because they always leak

filteredSuite('Signal#filter', (baseSignal, filter) => baseSignal.filter(filter));

mappedSuite('Signal#map', (baseSignal, transform) => baseSignal.map(transform));

mergedSuite('Signal#merge', (baseSignal, ...signals) => baseSignal.merge(...signals));

mergedSuite('Signal.merge', (baseSignal, ...signals) => Signal.merge(baseSignal, ...signals));

promisifySuite('Signal#promisify', (resolveSignal, rejectSignal?) =>
    resolveSignal.promisify(rejectSignal)
);

promisifySuite('Signal.promisify', (resolveSignal, rejectSignal?) =>
    Signal.promisify(resolveSignal, rejectSignal)
);

readOnlySuite('Signal#readOnly', (signal) => signal.readOnly());

reducedSuite('Signal#reduce', (baseSignal, accumulator, initialValue) =>
    baseSignal.reduce(accumulator, initialValue)
);

peekedSuite('Signal#peek', (baseSignal, peeker) => baseSignal.peek(peeker));

test('Signal listeners should received dispatched payloads', (t) => {
    const signal = new Signal<string>();

    const sentPayloads = ['a', 'b', 'c'];

    const receivedPayloadsListener1: string[] = [];
    const receivedPayloadsListener2: string[] = [];

    signal.add((payload: string) => receivedPayloadsListener1.push(payload));
    signal.add((payload: string) => receivedPayloadsListener2.push(payload));
    sentPayloads.forEach((payload) => signal.dispatch(payload));

    t.deepEqual(receivedPayloadsListener1, sentPayloads);
    t.deepEqual(receivedPayloadsListener2, sentPayloads);

    t.end();
});

test('Signal listeners should be called only once when using add', (t) => {
    const signal = new LeakDetectionSignal<void>();
    let callCount = 0;

    const listener = () => callCount++;

    signal.add(listener);
    signal.add(listener); // it's a Set(), so there is no extra listener added
    t.equal(signal.listenerCount, 1);

    signal.dispatch(undefined);

    t.equal(callCount, 1);

    t.end();
});

test('Signal listener should be called only once when using addOnce', (t) => {
    const signal = new Signal<void>();
    let callCount = 0;

    signal.addOnce(() => callCount++);

    for (let i = 0; i < 3; i++) {
        signal.dispatch(undefined);
    }

    t.equal(callCount, 1);

    t.end();
});

test('Signal listener should only be added once when using addOnce to match behavior of add', (t) => {
    const signal = new Signal<void>();
    let callCount = 0;

    const listener = () => callCount++;

    signal.addOnce(listener);
    signal.addOnce(listener);

    signal.dispatch(undefined);

    t.equal(callCount, 1);

    t.end();
});

/**
 * This tests the type of the filter function exclusively. There is no runtime assertion in this
 * test, but this test will fail the TypeScript typechecker if we have broken this functionality.
 */
test('Signal.filter types should allow for filtering using type predicates correctly', (t) => {
    function isString(x: any): x is string {
        return typeof x === 'string';
    }

    const signal = new Signal<undefined | string>();
    const readableSignal: ReadableSignal<undefined | string> = new Signal();

    const filteredSignal = signal.filter(isString);
    const filteredReadableSignal = readableSignal.filter(isString);

    filteredSignal.add((s) => s.length);
    filteredReadableSignal.add((s) => s.length);

    t.end();
});

test('Signal removing a one time listener should prevent it from being called ', (t) => {
    const receivedPayloads: string[] = [];

    const signal = new Signal<string>();

    const addOnceListener = (payload: string) => receivedPayloads.push(payload);
    signal.addOnce(addOnceListener);

    signal.remove(addOnceListener);
    signal.dispatch('a');

    t.deepEqual(receivedPayloads, []);

    t.end();
});

test('Signal removing a listener should stop further updates', (t) => {
    const receivedPayloadsListener1: string[] = [];
    const receivedPayloadsListener2: string[] = [];
    const receivedPayloadsListener3: string[] = [];

    const signal = new Signal<string>();

    const listener1 = (payload: string) => receivedPayloadsListener1.push(payload);
    signal.add(listener1);
    const listener2 = (payload: string) => receivedPayloadsListener2.push(payload);
    signal.add(listener2);
    const addOnceListener = (payload: string) => receivedPayloadsListener3.push(payload);
    signal.addOnce(addOnceListener);

    signal.remove(addOnceListener);
    signal.dispatch('a');
    signal.remove(listener1);
    signal.dispatch('b');
    signal.remove(listener2);
    signal.dispatch('c');

    t.deepEqual(receivedPayloadsListener1, ['a']);
    t.deepEqual(receivedPayloadsListener2, ['a', 'b']);
    t.deepEqual(receivedPayloadsListener3, []);

    t.end();
});

test('Signal methods should be chainable', (t) => {
    const s1 = new Signal<number>();
    const s2 = new Signal<string>();

    const addPayloads: string[] = [];
    const addOncePayloads: string[] = [];

    const s3 = s1
        .filter((x) => x < 10)
        .map((x) => `a${x}`)
        .merge(s2)
        .readOnly();

    s3.add((payload) => addPayloads.push(payload));
    s3.addOnce((payload) => addOncePayloads.push(payload));

    s1.dispatch(1);
    s1.dispatch(15);
    s1.dispatch(5);
    s2.dispatch('14');
    s1.dispatch(-5);

    t.deepEqual(addPayloads, ['a1', 'a5', '14', 'a-5']);
    t.deepEqual(addOncePayloads, ['a1']);
    t.end();
});

test('addOnce should the same as add when adding a listener multiple times', (t) => {
    const s1 = new Signal<number>();

    const payloads: number[] = [];

    const listener = (payload: number) => payloads.push(payload);

    s1.addOnce(listener);
    s1.addOnce(listener);

    s1.remove(listener);

    s1.dispatch(1);

    t.deepEqual(payloads, []);

    t.end();
});

test('dispatches to static default listener if no instance default listener is set', (t) => {
    const staticCalls: any[][] = [];
    const staticDefaultListener = (...args: any[]) => staticCalls.push(args);
    Signal.setDefaultListener(staticDefaultListener);
    const s = new Signal<number>();
    s.dispatch(1);
    t.equal(staticCalls[0]![0], 1);
    t.end();
});

test('dispatches to instance default listener when it is set', (t) => {
    const staticCalls: any[][] = [];
    const instanceCalls: any[][] = [];
    const staticDefaultListener = (...args: any[]) => staticCalls.push(args);
    const instanceDefaultListener = (...args: any[]) => instanceCalls.push(args);
    Signal.setDefaultListener(staticDefaultListener);
    const s = new Signal<number>();
    s.setDefaultListener(instanceDefaultListener);
    s.dispatch(1);
    t.equal(staticCalls.length, 0);
    t.equal(instanceCalls[0]![0], 1);
    t.end();
});

test('does not dispatch to static default listener when other listeners have been added', (t) => {
    const staticCalls: number[] = [];
    const staticDefaultListener = (payload: number) => staticCalls.push(payload);
    Signal.setDefaultListener(staticDefaultListener);
    const s = new Signal<number>();
    s.add(() => {
        // no-op
    });

    s.dispatch(1);

    t.equal(staticCalls.length, 0);
    t.end();
});

test('does not dispatch to static default listener when other listeners have been added', (t) => {
    const instanceCalls: number[] = [];
    const instanceDefaultListener = (payload: number) => instanceCalls.push(payload);
    const s = new Signal<number>();
    s.setDefaultListener(instanceDefaultListener);
    s.add(() => {
        // no-op
    });

    s.dispatch(1);

    t.equal(instanceCalls.length, 0);
    t.end();
});

test('merged + promisify dispatches with the first dispatched signal only', async (t) => {
    const a = new LeakDetectionSignal<string>();
    const b = new LeakDetectionSignal<number>();
    const c = new LeakDetectionSignal<{ object: 'yes' }>();

    const merged = Signal.merge<number | string | { object: 'yes' }>(a, b, c);
    const signalPromise = merged.promisify();

    a.dispatch('foobar');
    b.dispatch(Infinity);
    c.dispatch({ object: 'yes' });

    t.equal('foobar', await signalPromise);
    t.equal(b.listenerCount, 0);
    t.equal(a.listenerCount, 0);
    t.equal(c.listenerCount, 0);

    t.end();
});
