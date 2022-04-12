import test from 'tape';

import { LeakDetectionSignal } from './lib/leak-detection-signal.js';

test('extended signal should provide correct listener count', (t) => {
    const signal = new LeakDetectionSignal();
    t.equal(signal.listenerCount, 0);
    const listener = () => {
        /* empty listener */
    };
    signal.add(listener);
    t.equal(signal.listenerCount, 1);
    signal.remove(listener);
    t.equal(signal.listenerCount, 0);
    t.end();
});

// test('extended signal should provide correct listener count', (t) => {
//     const signal = new LeakDetectionSignal();
//     const readOnly = signal.readOnly();
//     t.equal(signal.listenerCount, 0);
//     const listener = () => {
//         /* empty listener */
//     };
//     readOnly.add(listener);
//     t.equal(signal.listenerCount, 1, `add on listener ${signal.listenerCount}`);
//     readOnly.add(listener);
//     t.equal(signal.listenerCount, 1, `add same listener again is a no-op ${signal.listenerCount}`);
//
//     readOnly.remove(listener);
//     t.equal(signal.listenerCount, 0);
//     t.end();
// });
//
