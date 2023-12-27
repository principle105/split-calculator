<script lang="ts">
    import toast from "svelte-french-toast";
    import LZString from "lz-string";

    import { addTimeAndConvertToMilliseconds } from "$lib/utils";
    import type { Interval } from "$lib/types";

    import intervals from "$lib/stores/intervals";
    import distance from "$lib/stores/distance";

    import FaShareAlt from "svelte-icons/fa/FaShareAlt.svelte";

    export let tutorialStage: number;

    $: shareCode = createShareCode($intervals);

    const createShareCode = (intervals: Interval[]) => {
        const compressedIntervals = intervals
            .map((interval) => {
                const totalMilliseconds = addTimeAndConvertToMilliseconds(
                    0,
                    interval.minutes,
                    interval.seconds,
                    interval.milliseconds
                );
                return `${Math.round(interval.size * 100) / 100},${
                    Math.floor(totalMilliseconds / 100) / 100
                }`;
            })
            .join(",");

        return LZString.compressToEncodedURIComponent(
            `${compressedIntervals},${$distance}`
        );
    };

    const copyURLToClipboard = () => {
        const shareURL = `${window.location.origin}/?i=${shareCode}`;

        navigator.clipboard.writeText(shareURL);

        toast.success("Share link copied to clipboard");
    };
</script>

<div
    class="relative items-center border border-indigo-400 rounded-md overflow-hidden text-sm hidden lg:flex bg-white dark:bg-zinc-800 dark:text-white {tutorialStage ===
        8 && 'z-50'}"
>
    <div class="pl-2 pr-1 invisible">
        {window.location.origin}/?i=mmm
    </div>
    <div class="pl-2 absolute">
        <span class="z-10">
            {window.location.origin}/?i={shareCode.substring(0, 5)}
        </span>
    </div>
    <div class="relative">
        <button
            on:click={copyURLToClipboard}
            class=" text-white bg-indigo-600 hover:bg-indigo-700 font-medium px-3.5 py-[0.575rem] dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
        >
            Copy Share Link
        </button>
        <div
            class="absolute bg-white dark:bg-zinc-800 h-full w-1 bottom-0 left-0 z-10"
        />
    </div>
</div>

<button
    on:click={copyURLToClipboard}
    class="text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-md text-sm p-3 lg:px-5 lg:py-2.5 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors lg:hidden {tutorialStage ===
        8 && 'z-50'}"
    aria-label="Copy share URL"
>
    <div class="w-5 h-5 lg:hidden">
        <FaShareAlt />
    </div>
</button>
