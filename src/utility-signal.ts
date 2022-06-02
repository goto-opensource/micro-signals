import { ReadableSignal } from './interfaces.js';
import { Signal } from './signal.js';

export const timeoutSignal = <T = void>(timeOut = 1000, payload?: T): ReadableSignal<T> => {
    const signal = new Signal<T>();
    setTimeout(() => {
        signal.dispatch(payload!);
    }, timeOut);
    return signal.readOnly();
};
