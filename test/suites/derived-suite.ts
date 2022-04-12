import test from 'tape';

import { ReadableSignal, Signal } from '../../src/index.js';
import { LeakDetectionSignal } from '../lib/leak-detection-signal.js';

export type CreateDerivedSignal = <T>(baseSignal: ReadableSignal<T>) => ReadableSignal<T>;

export function derivedSuite(prefix: string, createDerivedSignal: CreateDerivedSignal) {
    // test(`${prefix} listeners should be called only once when using add`, (t) => {
    //     const signal = new LeakDetectionSignal<void>();
    //     const derivedSignal = createDerivedSignal(signal);
    //     let callCount = 0;

    //     const listener = () => callCount++;

    //     derivedSignal.add(listener);
    //     t.equal(signal.listenerCount, 1, `add on listener ${signal.listenerCount}`);
    //     derivedSignal.add(listener); // it's a Set(), so there is no extra listener added
    //     t.equal(signal.listenerCount, 1, `add same listener again is a no-op ${signal.listenerCount}`);

    //     signal.dispatch(undefined);

    //     t.equal(callCount, 1);

    //     t.end();
    // });

    test(`${prefix} listener should be called only once when using addOnce and filter returns true`, (t) => {
        const signal = new Signal<string>();
        const derivedSignal = createDerivedSignal(signal);
        let callCount = 0;

        derivedSignal.addOnce(() => callCount++);

        for (let i = 0; i < 3; i++) {
            signal.dispatch('a');
        }

        t.equal(callCount, 1);

        t.end();
    });

    test(`${prefix} removing a listener should prevent further updates`, (t) => {
        const receivedPayloads1: string[] = [];
        const receivedPayloads2: string[] = [];
        const receivedPayloads3: string[] = [];
        const addOncePayloads: string[] = [];

        const signal = new Signal<string>();
        const derivedSignal = createDerivedSignal(signal);

        const listener1 = (payload: string) => {
            receivedPayloads1.push(payload);
        };
        derivedSignal.add(listener1);

        const listener2 = (payload: string) => {
            receivedPayloads2.push(payload);
        };
        derivedSignal.add(listener2);

        const listener3 = (payload: string) => {
            receivedPayloads3.push(payload);
        };
        derivedSignal.add(listener3);

        const addOnceListener = (payload: string) => {
            addOncePayloads.push(payload);
        };
        derivedSignal.addOnce(addOnceListener);

        derivedSignal.remove(addOnceListener);
        derivedSignal.remove(listener1);
        signal.dispatch('a');
        derivedSignal.remove(listener2);
        signal.dispatch('a');
        derivedSignal.remove(listener3);

        t.deepEqual(receivedPayloads1, []);
        t.deepEqual(receivedPayloads2, ['a']);
        t.deepEqual(receivedPayloads3, ['a', 'a']);
        t.deepEqual(addOncePayloads, []);

        t.end();
    });

    test('DerivedSignal should not leak', (t) => {
        const signal = new LeakDetectionSignal<void>();
        const derivedSignal = createDerivedSignal(signal);

        const listener = () => {
            /* empty listener */
        };
        derivedSignal.add(listener);
        t.equal(signal.listenerCount, 1, 'has one listeners');

        signal.dispatch(undefined);
        derivedSignal.remove(listener);

        t.equal(signal.listenerCount, 0, 'has no more listeners');
        t.end();
    });

    test(`${prefix} can clear its listeners without clearing its parents listeners`, (t) => {
        const rootSignal = new LeakDetectionSignal<void>();
        // const childSignal = createDerivedSignal(rootSignal);
        t.equal(rootSignal.listenerCount, 0, 'root no listener');
        const child = new LeakDetectionSignal<void>();
        const childSignal = rootSignal.chain(child);
        t.equal(rootSignal.listenerCount, 1, 'root one listener');
        const grandChildSignal = createDerivedSignal(childSignal);

        let rootDispatched = 0;
        const listenerRoot = () => rootDispatched++;

        let childDispatched = 0;
        const listenerChild = () => childDispatched++;

        let grandChildDispatched = 0;
        const listenerGrandChild = () => grandChildDispatched++;

        rootSignal.add(listenerRoot);
        t.equal(rootSignal.listenerCount, 2, 'root has two listeners');
        // t.equal(child.listenerCount, 0, 'child has no listener');

        childSignal.add(listenerChild);
        t.equal(child.listenerCount, 1, 'child has one listener');
        t.equal(rootSignal.listenerCount, 2, 'root two listener');

        grandChildSignal.add(listenerGrandChild);
        rootSignal.dispatch(undefined);

        t.equal(child.listenerCount, 2, 'child has two listeners');
        t.equal(rootSignal.listenerCount, 2, 'root two listener');

        rootSignal.remove(childSignal);
        t.equal(rootSignal.listenerCount, 1, 'root one listener');

        child.clear();
        t.equal(child.listenerCount, 0);

        rootSignal.dispatch(undefined);
        t.equal(rootDispatched, 2, 'root dispatch 2');
        t.equal(childDispatched, 1, 'child dispatch 1');
        t.equal(grandChildDispatched, 1, 'grandchild dispatch 1');
        t.equal(rootSignal.listenerCount, 1, 'has one more listeners');
        t.end();
    });

    test(`${prefix} removing a listener should prevent further updates`, (t) => {
        const receivedPayloads1: string[] = [];
        const receivedPayloads2: string[] = [];
        const receivedPayloads3: string[] = [];
        const addOncePayloads: string[] = [];

        const signal = new Signal<string>();
        const filteredSignal = createDerivedSignal(signal);

        const listener1 = (payload: string) => {
            receivedPayloads1.push(payload);
        };
        filteredSignal.add(listener1);

        const listener2 = (payload: string) => {
            receivedPayloads2.push(payload);
        };
        filteredSignal.add(listener2);

        const listener3 = (payload: string) => {
            receivedPayloads3.push(payload);
        };
        filteredSignal.add(listener3);

        const addOnceListener = (payload: string) => {
            addOncePayloads.push(payload);
        };
        filteredSignal.addOnce(addOnceListener);

        filteredSignal.remove(addOnceListener);
        filteredSignal.remove(listener1);
        signal.dispatch('1');
        filteredSignal.remove(listener2);
        signal.dispatch('2');
        filteredSignal.remove(listener3);

        t.deepEqual(receivedPayloads1, []);
        t.deepEqual(receivedPayloads2, ['1']);
        t.deepEqual(receivedPayloads3, ['1', '2']);
        t.deepEqual(addOncePayloads, []);

        t.end();
    });
}
