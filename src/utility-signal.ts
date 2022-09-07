import { ReadableSignal } from './interfaces.js';
import { Signal } from './signal.js';

/**
 * Create a Signal that dispatches after a certain timeout.
 * @param timeout number of milliseconds after which to dispatch
 * @param payload what to dispatch
 * @returns ReadableSignal<T>
 */
export const timeoutSignal = <T = void>(timeout = 1000, payload?: T): ReadableSignal<T> => {
    const signal = new Signal<T>();
    setTimeout(() => {
        signal.dispatch(payload!);
    }, timeout);
    return signal.readOnly();
};

/**
 * Create a Signal that dispatches after a certain timeout.
 * This is more useful for cancelling promisified Signals,
 * since the payload of the rejectSignal is actually thrown
 * and some runtimes complain if you don't throw an `Error` instance.
 * @param timeout number of milliseconds after which to dispatch
 * @param errorProducer creates the error that the signal will dispatch
 * @returns ReadableSignal<Error>
 */
export const errorSignal = (timeout = 1000, errorProducer: () => Error): ReadableSignal<Error> => {
    const signal = new Signal<Error>();
    setTimeout(() => {
        signal.dispatch(errorProducer());
    }, timeout);
    return signal.readOnly();
};
