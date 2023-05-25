/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class",
    content: ["./index.html", "./src/**/*.{svelte,js,ts}"],
    theme: {
        extend: {
            colors: {
                "zinc-850": "#1D1D20",
            },
        },
    },
    plugins: [],
};
