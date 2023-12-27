import { writable } from "svelte/store";

const getInitialValue = () => {
    const isBrowser = typeof window !== "undefined";

    if (isBrowser) {
        const themeStorage = localStorage.getItem("color-theme");

        if (themeStorage === "dark") {
            return true;
        }

        if (
            !("color-theme" in localStorage) &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        ) {
            return true;
        }
    }

    return false;
};

const initialValue = getInitialValue();

const isDarkMode = writable<boolean>(initialValue);

isDarkMode.subscribe((value) => {
    const isBrowser = typeof window !== "undefined";

    if (isBrowser) {
        window.localStorage.setItem("color-theme", value ? "dark" : "light");
    }
});

export default isDarkMode;
