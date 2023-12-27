import { writable } from "svelte/store";

const defaultValue: number = 2000;

const getInitialValue = () => {
    const isBrowser = typeof window !== "undefined";

    if (isBrowser) {
        const distanceStorage = localStorage.getItem("distance");

        if (distanceStorage) {
            return parseInt(distanceStorage);
        }
    }

    return defaultValue;
};

const initialValue = getInitialValue();

const distance = writable<number>(initialValue);

distance.subscribe((value) => {
    const isBrowser = typeof window !== "undefined";

    if (isBrowser) {
        window.localStorage.setItem("distance", value.toString());
    }
});

export default distance;
