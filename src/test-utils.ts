import { CachedSignal, ReadableSignal } from './interfaces.js';

/**
 * makes a `ReadableSignal` look like a `CachedSignal`.
 */
export function fakeCachedSignal<T>(toBeCached: ReadableSignal<T>): CachedSignal<T, any> {
    return toBeCached as any;
}
