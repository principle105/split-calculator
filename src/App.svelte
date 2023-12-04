<script lang="ts">
    import { onMount } from "svelte";
    import { Pane, Splitpanes } from "svelte-splitpanes";
    import toast, { Toaster } from "svelte-french-toast";
    import LZString from "lz-string";
    import html2canvas from "html2canvas";

    import Tooltip from "./components/Tooltip.svelte";

    interface Interval {
        size: number;
        minutes: number;
        seconds: number;
        milliseconds: number;
        rawInput: string;
    }

    const SMALLEST_INTERVAL_SIZE: number = 5;
    const MAX_INTERVALS: number = 8;
    const MIN_DISTANCE: number = 100;
    const MAX_DISTANCE: number = 100000;
    const DEFAULT_INTERVAL: Interval = {
        size: 100,
        minutes: 2,
        seconds: 0,
        milliseconds: 0,
        rawInput: "2:00",
    };

    let distance: number = 2000;
    let distanceRawInput: string = distance.toString();

    let intervals: Interval[] = [DEFAULT_INTERVAL];

    let isLoaded: boolean = false;
    let isDarkMode: boolean = false;
    let showTooltipIndicators: boolean = false;

    let splitPaneElement: HTMLElement;

    $: intervals, updateIntervalsInStorage();
    $: distance, updateDistanceInStorage();

    $: minInc = Math.pow(10, Math.floor(Math.log10(distance))) / 100;
    $: averageTime = intervals ? calculateAverageTime() : 0;

    $: isDarkMode, updateTheme();

    const updateDistanceInStorage = () => {
        if (!isLoaded) return;
        localStorage.setItem("distance", distance.toString());
    };

    const updateIntervalsInStorage = () => {
        if (!isLoaded) return;
        localStorage.setItem("intervals", JSON.stringify(intervals));
    };

    onMount(() => {
        const themeStorage = localStorage.getItem("color-theme");

        isDarkMode =
            themeStorage === "dark" ||
            (!("color-theme" in localStorage) &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);

        const loadedURL = loadShareURL();

        if (!loadedURL) {
            const intervalStorage = localStorage.getItem("intervals");
            const distanceStorage = localStorage.getItem("distance");

            intervals = intervalStorage
                ? JSON.parse(intervalStorage)
                : [DEFAULT_INTERVAL];

            distance = distanceStorage ? parseInt(distanceStorage) : 2000;
            distanceRawInput = distance.toString();
        }

        isLoaded = true;
    });

    const toggleTheme = () => {
        isDarkMode = !isDarkMode;
        localStorage.setItem("color-theme", isDarkMode ? "dark" : "light");
    };

    const updateTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    };

    const formatMillisecondsAsTimestamp = (milliseconds: number): string => {
        const date = new Date(milliseconds).toISOString();

        if (milliseconds < 1) {
            return "0:00.0";
        }

        if (milliseconds < 3600 * 1000) {
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

            total +=
                ((v.minutes * 60 + v.seconds) * 1000 + v.milliseconds) * size;

            if (i === intervals.length - 1) {
                let difference = (distance - totalDistance) / distance;

                size += difference;
                total +=
                    ((v.minutes * 60 + v.seconds) * 1000 + v.milliseconds) *
                    difference;
            }

            v.size = size * 100;
        });

        // In milliseconds
        return total;
    };

    // const calculateAverageTime = (): number => {
    //     const totalDistance = intervals.reduce((acc, v) => acc + v.size, 0);
    //     const totalMilliseconds = intervals.reduce(
    //         (acc, v) =>
    //             acc +
    //             ((v.minutes * 60 + v.seconds) * 1000 + v.milliseconds) *
    //                 (v.size / totalDistance),
    //         0
    //     );

    //     return totalMilliseconds;
    // };

    const formatSplitAsTimestamp = (v: Interval) => {
        let timestamp = `${v.minutes}:${v.seconds.toString().padStart(2, "0")}`;

        if (v.milliseconds > 0) {
            timestamp += `.${(v.milliseconds / 100).toString()[0]}`;
        }

        return timestamp;
    };

    const parseTime = (time: string) => {
        const colonSplitParts = time.split(":");
        let minutes = parseInt(colonSplitParts[0]);

        let seconds = 0;
        let milliseconds = 0;

        if (colonSplitParts.length > 1) {
            const decimalSplitParts = colonSplitParts[1].split(".");

            seconds = parseInt(decimalSplitParts[0]);

            if (decimalSplitParts.length > 1 && decimalSplitParts[1] !== "") {
                milliseconds = parseInt(decimalSplitParts[1]) * 100;
            }
        }

        return [seconds, minutes, milliseconds];
    };
    const getDistance = (size: number) => {
        return Math.round(
            Math.round((size / (100 * minInc)) * distance) * minInc
        );
    };

    const removeInterval = (index: number) => {
        intervals.splice(index, 1);
        intervals = intervals;
    };

    const validateTime = (
        seconds: number,
        minutes: number,
        milliseconds: number
    ) => {
        if (isNaN(seconds) || isNaN(minutes) || isNaN(milliseconds)) {
            throw new Error("Invalid split, please input in the format 0:00.0");
        }

        if (milliseconds < 0 || milliseconds > 1000) {
            throw new Error("Milliseconds must take one decimal place");
        }

        if (minutes < 0 || minutes >= 10) {
            throw new Error("Minutes must be between 0 and 9");
        }

        if (seconds < 0 || seconds >= 60) {
            throw new Error("Seconds must be between 0 and 59");
        }
    };

    const handleSplitInput = (event, index: number) => {
        let enteredTime = event.target.value;

        const [seconds, minutes, milliseconds] = parseTime(enteredTime);

        try {
            validateTime(seconds, minutes, milliseconds);
        } catch (e) {
            return;
        }

        intervals[index].seconds = seconds;
        intervals[index].minutes = minutes;
        intervals[index].milliseconds = milliseconds;
    };

    const handleSplitBlur = (index: number) => {
        const [seconds, minutes, milliseconds] = parseTime(
            intervals[index].rawInput
        );

        try {
            validateTime(seconds, minutes, milliseconds);
        } catch (e) {
            toast.error(e.message);
        }

        intervals[index].rawInput = formatSplitAsTimestamp(intervals[index]);
    };

    const handleDistanceInput = (event) => {
        let enteredDistance = event.target.value;

        if (!enteredDistance.match(/^\d+$/)) return;
        if (parseInt(enteredDistance) < MIN_DISTANCE) {
            distance = MIN_DISTANCE;
            return;
        }
        if (enteredDistance > MAX_DISTANCE) {
            distance = MAX_DISTANCE;
            return;
        }

        distance = parseInt(enteredDistance);
    };

    const handleDistanceBlur = () => {
        const distanceRawInputNumber = parseInt(distanceRawInput);

        if (!distanceRawInput.match(/^\d+$/)) {
            toast.error("Distance must be a number");
        } else if (distanceRawInputNumber < MIN_DISTANCE) {
            toast.error(`Distance must be greater than ${MIN_DISTANCE} metres`);
        } else if (parseInt(distanceRawInput) > MAX_DISTANCE) {
            toast.error(
                `Distance must be less than ${MAX_DISTANCE.toLocaleString()} metres`
            );
        }

        distanceRawInput = distance.toString();
    };

    const handleSectionResize = (event) => {
        intervals = intervals.map((interval, i) => ({
            ...interval,
            size: event.detail[i].size,
        }));
    };

    const addSection = () => {
        if (intervals.length >= MAX_INTERVALS) {
            toast.error(`You can have a maximum of ${MAX_INTERVALS} sections`);
            return;
        }

        for (let i = intervals.length - 1; i >= 0; i--) {
            if (Math.round(intervals[i].size) > SMALLEST_INTERVAL_SIZE) {
                intervals[i].size -= SMALLEST_INTERVAL_SIZE;
                break;
            }
        }

        const newInterval = {
            ...DEFAULT_INTERVAL,
            size: SMALLEST_INTERVAL_SIZE,
        };
        intervals = [...intervals, newInterval];
    };

    const createShareURL = () => {
        const encodedIntervals = LZString.compressToEncodedURIComponent(
            JSON.stringify({
                intervals,
                distance,
            })
        );

        return encodedIntervals;
    };

    const loadShareURL = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedIntervals = urlParams.get("i");

        if (encodedIntervals) {
            window.history.replaceState(null, "", "/");

            try {
                const decodedIntervals = JSON.parse(
                    LZString.decompressFromEncodedURIComponent(encodedIntervals)
                );

                intervals = decodedIntervals.intervals;
                distance = decodedIntervals.distance;
                distanceRawInput = distance.toString();
            } catch (e) {
                toast.error("Failed to load splits from URL");
                return false;
            }

            toast.success("Successfully loaded splits from URL");
            return true;
        }

        return false;
    };

    const copyURLToClipboard = () => {
        const encodedIntervals = createShareURL();
        const url = `${window.location.origin}/?i=${encodedIntervals}`;

        navigator.clipboard.writeText(url);

        toast.success("Copied to clipboard");
    };

    const blurOnEnter = (e) => {
        if (e.key === "Enter") {
            // @ts-ignore
            e.target.blur();
        }
    };

    const downloadSplitsAsImage = async () => {
        if (intervals.length === 0) {
            toast.error("You don't have any sections");
            return;
        }

        try {
            const style = document.createElement("style");
            document.head.appendChild(style);

            // Somehow this fixes the input vertical alignment issue a bit
            style.sheet?.insertRule(
                "body > div:last-child img { display: inline-block; }"
            );

            const canvas = await html2canvas(splitPaneElement, {
                ignoreElements: (element) => {
                    return element.classList.contains("remove-section");
                },
                backgroundColor: "transparent",
            });

            const image = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.href = image;
            downloadLink.download = "splits.png";

            downloadLink.click();

            toast.success("Splits exported as image");
        } catch (error) {
            toast.error("Failed to export splits as image");
        }
    };

    const resetIntervals = () => {
        if (confirm("Are you sure you want to clear all the sections?")) {
            intervals = [];
        }
    };
</script>

<Toaster toastOptions={{ className: "toast" }} />
<header class="absolute right-8 top-8">
    <button on:click={toggleTheme} aria-label="Change theme">
        {#if !isDarkMode}
            <svg
                class="w-10 h-10 text-zinc-800"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                ><path
                    d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                /></svg
            >
        {:else}
            <svg
                class="w-10 h-10 text-white"
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
        Split Calculator <Tooltip
            showing={showTooltipIndicators}
            message="Click to change the total distance"
            positioning="top-[calc(-100%-1rem)]"
            ><span
                class="dark:bg-zinc-700 bg-zinc-200 !bg-opacity-[0.35] rounded-lg p-1"
                aria-label="Change the total distance"
                >(<input
                    bind:value={distanceRawInput}
                    on:input={handleDistanceInput}
                    on:blur={handleDistanceBlur}
                    on:keypress={blurOnEnter}
                    style="width: {distanceRawInput.toString().length}ch"
                    class="bg-transparent outline-none w-7"
                />m)
            </span>
        </Tooltip>
    </h1>

    <h2 class="text-2xl text-zinc-700 text-center dark:text-zinc-400">
        <Tooltip
            showing={showTooltipIndicators}
            message="Total time and average split"
            top={false}
            positioning="bottom-[calc(-100%-1.85rem)]"
        >
            <span class="font-medium">
                {formatMillisecondsAsTimestamp(
                    (averageTime / 500) * distance
                )}</span
            >
            <span>({formatMillisecondsAsTimestamp(averageTime)})</span>
        </Tooltip>
    </h2>

    <div class="flex mb-2.5 mt-10 justify-between">
        <div class="flex gap-2">
            <Tooltip
                showing={showTooltipIndicators}
                positioning="top-[calc(-100%-2rem)]"
                message="Click to add a new section"
            >
                <button
                    on:click={addSection}
                    class="text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-md text-sm px-5 py-2.5 dark:bg-indigo-500 dark:hover:bg-indigo-700 transition-colors"
                >
                    Add Section
                </button>
            </Tooltip>

            <Tooltip
                showing={showTooltipIndicators}
                positioning="bottom-[calc(-100%-2rem)]"
                message="Export your plan as an image"
                top={false}
            >
                <button
                    on:click={downloadSplitsAsImage}
                    class="text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-md text-sm px-5 py-2.5 dark:bg-emerald-500 dark:hover:bg-emerald-700 transition-colors"
                >
                    Export as Image
                </button>
            </Tooltip>

            <Tooltip
                showing={showTooltipIndicators}
                positioning="top-[calc(-100%-2rem)]"
                message="Clear all the sections"
            >
                <button
                    on:click={resetIntervals}
                    class="text-white bg-red-600 hover:bg-red-700 font-medium rounded-md text-sm px-5 py-2.5 dark:bg-red-500 dark:hover:bg-red-700 transition-colors"
                >
                    Clear Sections
                </button>
            </Tooltip>
        </div>

        <Tooltip
            showing={showTooltipIndicators}
            top={false}
            positioning="bottom-[calc(-100%-0.5rem)]"
            message="Share your plan with others"
        >
            <div
                class="flex items-center border border-emerald-400 rounded-md overflow-hidden text-sm"
            >
                <div class="pl-2 pr-1 dark:text-white relative">
                    <span>{window.location.origin}/?i=N4Igl</span>
                    <div
                        class="absolute bg-white dark:bg-zinc-800 h-full w-1 bottom-0 right-1 transition-colors"
                    />
                </div>
                <button
                    on:click={copyURLToClipboard}
                    class="text-white bg-emerald-600 hover:bg-emerald-700 font-medium px-3.5 py-[0.575rem] dark:bg-emerald-500 dark:hover:bg-emerald-700 transition-colors"
                >
                    Copy Share Link
                </button>
            </div>
        </Tooltip>
    </div>

    <!-- Split pane -->
    <div class="overflow-hidden rounded-md relative">
        <p
            class="py-[3.575rem] text-center bg-zinc-100 text-zinc-800 font-medium dark:!bg-zinc-700 dark:!text-white"
        >
            {#if intervals.length == 0}
                You don't have any sections
            {:else}
                &nbsp
            {/if}
        </p>

        {#if isLoaded}
            <div bind:this={splitPaneElement} class="absolute inset-0">
                <Splitpanes
                    on:resize={handleSectionResize}
                    on:resized={handleSectionResize}
                >
                    {#each intervals as interval, i}
                        <Pane
                            minSize={SMALLEST_INTERVAL_SIZE}
                            size={interval.size}
                            class="px-2 flex flex-col justify-center gap-1 dark:!bg-zinc-700 !bg-zinc-100"
                        >
                            <h3 class="text-sm dark:text-white">
                                {distance ? getDistance(interval.size) : 0}m
                            </h3>

                            <input
                                type="text"
                                aria-label="Split time"
                                bind:value={interval.rawInput}
                                on:input={(e) => handleSplitInput(e, i)}
                                on:blur={() => handleSplitBlur(i)}
                                on:keypress={blurOnEnter}
                                maxlength="6"
                                class="outline-none w-full block max-w-[3.25rem] text-center rounded-md dark:bg-zinc-600 dark:text-white my-1 py-2 !leading-6 {interval
                                    .rawInput.length > 4
                                    ? 'text-sm'
                                    : 'text-base'}"
                            />
                            <div>
                                <button
                                    on:click={() => {
                                        removeInterval(i);
                                    }}
                                    aria-label="Remove section"
                                    class="text-zinc-800 font-medium rounded-lg text-sm p-1 text-center inline-flex items-center dark:text-zinc-200 transition-colors remove-section"
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
        {/if}
    </div>
</main>
<footer
    class="text-zinc-800 px-3 py-3 text-lg dark:text-white flex items-center justify-between"
>
    <div>
        <span>Made by:</span>
        <a
            class="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-500 transition-color font-medium"
            href="https://github.com/principle105/split-calculator"
            target="_blank"
            rel="noreferrer"
        >
            principle105
        </a>
    </div>
    <div class="flex items-center gap-1.5">
        <span>Confused?</span>
        <button
            aria-label="Toggle tooltip indicators"
            on:click={() => (showTooltipIndicators = !showTooltipIndicators)}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                class="w-7 h-7"
                fill="currentColor"
            >
                <path
                    d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"
                />
            </svg>
        </button>
    </div>
</footer>

<style global lang="postcss">
    :global(.dark .splitpanes__splitter) {
        @apply !bg-zinc-500 !border-zinc-600;
    }

    :global(.dark .toast) {
        @apply !bg-zinc-850 !text-white;
    }
</style>
