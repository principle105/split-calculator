<script lang="ts">
    import { onMount } from "svelte";
    import { Pane, Splitpanes } from "svelte-splitpanes";

    interface Interval {
        size: number;
        minutes: number;
        seconds: number;
        rawInput: string;
    }

    const DEFAULT_INTERVAL: Interval = {
        size: 100,
        minutes: 2,
        seconds: 0,
        rawInput: "2:00",
    };

    let distance: number = 2000;
    let intervals: Interval[] = [DEFAULT_INTERVAL];

    $: minInc = Math.pow(10, Math.floor(Math.log10(distance))) / 100;

    let isDarkMode: boolean = false;

    const toggleMode = () => {
        isDarkMode = !isDarkMode;

        localStorage.setItem("color-theme", isDarkMode ? "dark" : "light");
    };

    onMount(() => {
        isDarkMode =
            localStorage.getItem("color-theme") === "dark" ||
            (!("color-theme" in localStorage) &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);
    });

    $: isDarkMode, updateTheme();

    const updateTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    const handleResize = (event) => {
        intervals = intervals.map((interval, i) => ({
            ...interval,
            size: event.detail[i].size,
        }));
    };

    const formatSeconds = (totalSeconds: number): string => {
        const date = new Date(totalSeconds * 1000).toISOString();

        if (totalSeconds < 1) {
            return "0:00.0";
        }

        if (totalSeconds < 3600) {
            return date.substring(14, 21).replace(/^0+(?!:)/, "");
        }

        return date.substring(11, 21).replace(/^0+/, "");
    };

    const calculateAverageTime = (): number => {
        let total = 0;
        let totalDistance = 0;

        intervals.forEach((v, i) => {
            // Ensures that average only updates by increment
            let size = getDistance(v.size) / distance;

            totalDistance += size * distance;

            total += (v.minutes * 60 + v.seconds) * size;

            if (i === intervals.length - 1) {
                let difference = (distance - totalDistance) / distance;

                size += difference;
                total += (v.minutes * 60 + v.seconds) * difference;
            }

            v.size = size * 100;
        });

        return total;
    };

    $: average = intervals ? calculateAverageTime() : 0;

    const formatSplit = (v: Interval) => {
        return `${v.minutes}:${v.seconds.toString().padStart(2, "0")}`;
    };

    const parseTime = (time: string) => {
        const parts = time.split(":");
        let minutes = parseInt(parts[0]);
        let seconds = parseInt(parts[1]);

        return [seconds, minutes];
    };

    const getDistance = (size: number) => {
        return Math.round((size / (100 * minInc)) * distance) * minInc;
    };

    const handleInput = (event, index: number) => {
        let enteredTime = event.target.value;

        const [seconds, minutes] = parseTime(enteredTime);

        if (minutes >= 0 && minutes < 10 && seconds >= 0 && seconds < 60) {
            intervals[index].seconds = seconds;
            intervals[index].minutes = minutes;
        }
    };

    const removeInterval = (index: number) => {
        intervals.splice(index, 1);
        intervals = intervals;
    };

    const handleBlur = (index: number) => {
        intervals[index].rawInput = formatSplit(intervals[index]);
    };
</script>

<header class="absolute right-8 top-8">
    <button on:click={toggleMode}>
        {#if isDarkMode}
            <svg
                class="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                ><path
                    d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                /></svg
            >
        {:else}
            <svg
                class="w-10 h-10 text-zinc-800"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                ><path
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                /></svg
            >
        {/if}
    </button>
</header>
<main class="m-auto w-5/6">
    <h1
        class="text-5xl text-zinc-800 text-center font-bold mb-2 dark:text-white"
    >
        Split Calculator (<input
            bind:value={distance}
            style="width: {distance.toString().length}ch"
            class="bg-transparent outline-none w-7"
        />m)
    </h1>
    <h2 class="text-2xl text-zinc-700 text-center dark:text-zinc-400">
        <span class="font-medium">
            {formatSeconds((average / 500) * distance)}</span
        >
        <span>({formatSeconds(average)})</span>
    </h2>
    <button
        on:click={() => {
            intervals = [...intervals, DEFAULT_INTERVAL];
        }}
        class="text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-indigo-500 dark:hover:bg-indigo-700"
    >
        Add Section
    </button>
    <div class="overflow-hidden rounded-md">
        {#if intervals.length == 0}
            <p
                class="py-[3.25rem] text-center bg-zinc-100 text-zinc-800 font-medium"
            >
                You don't have any sections
            </p>
        {/if}
        <Splitpanes on:resize={handleResize} on:resized={handleResize}>
            {#each intervals as interval, i}
                <Pane
                    minSize={5}
                    class="px-2 py-3 flex flex-col gap-1 dark:!bg-zinc-700"
                >
                    <h4 class="text-sm dark:text-white">
                        {distance ? getDistance(interval.size) : 0}m
                    </h4>

                    <input
                        type="text"
                        bind:value={interval.rawInput}
                        on:input={(e) => handleInput(e, i)}
                        on:blur={() => handleBlur(i)}
                        maxlength="4"
                        class="outline-none w-full max-w-[3.25rem] py-2 text-center rounded-md dark:bg-zinc-600 dark:text-white my-1"
                    />
                    <div>
                        <button
                            on:click={() => {
                                removeInterval(i);
                            }}
                            class="text-zinc-800 font-medium rounded-lg text-sm p-1 text-center inline-flex items-center dark:text-zinc-200"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 448 512"
                                class="w-5 h-5"
                                fill="currentColor"
                            >
                                <path
                                    d="M32 464a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128H32zm272-256a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zM432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z"
                                />
                            </svg>
                        </button>
                    </div>
                </Pane>
            {/each}
        </Splitpanes>
    </div>
</main>
<footer class="text-zinc-800 px-3 py-3 text-lg dark:text-white">
    <span>Made by:</span>
    <a
        class="text-indigo-500 hover:text-indigo-600 transition-color font-medium"
        href="https://github.com/principle105"
        target="_blank"
        rel="noreferrer"
    >
        principle105
    </a>
</footer>

<style global>
    @tailwind utilities;
    @tailwind components;
    @tailwind base;
</style>
