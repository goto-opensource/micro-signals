import test from 'tape';

// eslint-disable-next-line @typescript-eslint/no-shadow
import { Cache } from '../../src/index.js';
import { LeakDetectionSignal } from '../lib/leak-detection-signal.js';

export function cacheSuite(cacheClass: { <T>(): Cache<T> }, expected: <T>(testCase: T[]) => T[]) {
    const cacheName = cacheClass.name;

    test(`${cacheName} call forEach callback if add has not been called`, (t) => {
        const cache = cacheClass();
        let hasValue = false;
        cache.forEach(() => (hasValue = true));
        t.false(hasValue);
        t.end();
    });

    function testCacheWithValues<T>(testDescription: string, testValues: T[]) {
        test(testDescription, (t) => {
            const cache = cacheClass<T>();
            const cachedValues: T[] = [];

            testValues.forEach((value) => cache.add(value));

            cache.forEach((value) => cachedValues.push(value));

            t.deepEqual(cachedValues, expected(testValues));
            t.end();
        });
    }

    testCacheWithValues(`${cacheName} calls the forEach callback with the correct values`, [
        0,
        2,
        4,
        Infinity,
        1,
        49,
        0,
    ]);

    testCacheWithValues(`${cacheName} works with null and undefined values`, [
        null,
        0,
        2,
        4,
        undefined,
        Infinity,
        1,
        49,
        null,
        0,
        undefined,
    ]);

    test(`${cacheName} cached signal should not leak`, (t) => {
        const signal = new LeakDetectionSignal<void>();
        t.equal(signal.listenerCount, 0, 'start with 0 listeners');
        const cachedSignal = signal.cache(cacheClass<void>());
        t.equal(signal.listenerCount, 1, 'has one listener after caching');

        const listener = () => {
            /* empty listener */
        };
        cachedSignal.add(listener);
        t.equal(signal.listenerCount, 2, 'has two listeners after adding');

        signal.dispatch(undefined);
        cachedSignal.remove(listener);

        t.equal(signal.listenerCount, 1, 'has only cache listener again after removing');
        signal.clear();
        t.equal(signal.listenerCount, 0, 'root has 0 listeners after clear');
        t.end();
    });
}
