import { writable } from "svelte/store";
import type { Interval } from "../types";
import { DEFAULT_INTERVAL } from "../constants";

const defaultIntervals = [DEFAULT_INTERVAL];

const getInitialValue = () => {
    const isBrowser = typeof window !== "undefined";

    if (isBrowser) {
        const intervalStorage = localStorage.getItem("intervals");

        if (intervalStorage) {
            return JSON.parse(intervalStorage);
        }
    }

    return [defaultIntervals];
};

const initialValue = getInitialValue();

const intervals = writable<Interval[]>(initialValue);

intervals.subscribe((value) => {
    const isBrowser = typeof window !== "undefined";

    if (isBrowser) {
        window.localStorage.setItem("intervals", JSON.stringify(value));
    }
});

export default intervals;
