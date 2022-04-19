/**
 * this should only compile
 */

import { CollectionCache, Signal, ValueCache } from '../src/index.js';

// hover over merged1-4 and verify that they have the same types as described in the comments above
const signalNumber = new Signal<number>();
const signalString = new Signal<string>();
const readableSignalNumber = new Signal<number>().readOnly(); //.cache(new ValueCache<string>());
const readableSignalString = new Signal<string>().readOnly(); //.cache(new ValueCache<string>());
const cachedSignalNumber = new Signal<number>().cache();
const cachedSignalBoolean = new Signal<boolean>().cache(new ValueCache<boolean>());

const collectionCachedSignalBoolean = new Signal<boolean>().cache(new CollectionCache<boolean>());

// the following two lines should produce errors
// const cached: CachedSignal<string, ValueCache<string>> = signalString.cache(new CollectionCache());
// const cache: ValueCache<string> = new CollectionCache();

// ReadableSignal<string | number>
const merged0 = signalNumber.merge(signalString);

// ReadableSignal<string | number>
const merged1 = new Signal<string>().merge(signalNumber, signalNumber);

// CachedSignal<string | number, ValueCache<number>>
const merged2 = cachedSignalNumber.merge(signalString);

// CachedSignal<string | number, ValueCache<number>>
const merged3 = cachedSignalNumber.merge<string | number>(
    readableSignalString,
    readableSignalNumber
);

// CachedSignal<string | number, ValueCache<number>>
const merged4 = readableSignalString.merge(cachedSignalNumber);

// CachedSignal<string | number | boolean, ValueCache<number> | ValueCache<boolean>>
const merged5 = merged2.merge(cachedSignalBoolean);

// CachedSignal<string | number | boolean, ValueCache<number> | CollectionCache<boolean>>
const merged6 = merged3.merge(collectionCachedSignalBoolean);

const eat = (..._args: any[]) => void 0;
eat(merged0, merged1, merged2, merged3, merged4, merged5, merged6);
