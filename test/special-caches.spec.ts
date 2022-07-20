import test from 'tape';

import { CapacityCollectionCache, GroupingCache } from '../src/caches.js';
import { Signal } from '../src/index.js';

test('CapacityCollectionCache drops old payloads that when capacity is reached', (t) => {
    const signal = new Signal();
    const capacity = 4;

    const payloads = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'a'];
    const cached = signal.cache(new CapacityCollectionCache(capacity));

    payloads.forEach((x) => signal.dispatch(x));

    const received: any[] = [];
    cached.add((x) => received.push(x));

    t.equal(received.length, capacity);
    t.deepEqual(received, [7, 8, 9, 'a']);
    t.end();
});

test('CapacityCollectionCache dispatches all payloads if capacity is not yet reached', (t) => {
    const signal = new Signal();

    const payloads = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'a'];
    const cached = signal.cache(new CapacityCollectionCache(payloads.length + 1));

    payloads.forEach((x) => signal.dispatch(x));

    const received: any[] = [];
    cached.add((x) => received.push(x));

    t.equal(received.length, payloads.length);
    t.deepEqual(received, payloads);
    t.end();
});

test('GroupingCache#byProperty Caches all payloads grouped by property', (t) => {
    interface TypedValue {
        kind: 'red' | 'blue' | 'yellow';
        value: 'on' | 'off';
    }
    const signal = new Signal<TypedValue>();

    const payloads: TypedValue[] = [
        { kind: 'red', value: 'off' },
        { kind: 'blue', value: 'off' },
        { kind: 'red', value: 'on' },
        { kind: 'blue', value: 'on' },
        { kind: 'blue', value: 'off' },
        { kind: 'yellow', value: 'off' },
    ];

    const expected: TypedValue[] = [
        { kind: 'red', value: 'on' },
        { kind: 'blue', value: 'off' },
        { kind: 'yellow', value: 'off' },
    ];

    const cached = signal.cache(GroupingCache.byProperty<TypedValue>(({ kind }) => kind));
    payloads.forEach((x) => signal.dispatch(x));

    const received: any[] = [];
    cached.add((x) => received.push(x));

    t.equal(received.length, 3);
    t.deepEqual(received, expected);

    t.end();
});
