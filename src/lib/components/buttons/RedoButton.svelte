<script lang="ts">
    import {
        formatMillisecondsAsTimestamp,
        calculateAverageSplit,
    } from "$lib/utils";

    import redoStates from "$lib/stores/redoStates";
    import undoStates from "$lib/stores/undoStates";
    import intervals from "$lib/stores/intervals";
    import distance from "$lib/stores/distance";

    import FaRedoAlt from "svelte-icons/fa/FaRedoAlt.svelte";

    export let distanceRawInput: string;
    export let averageSplit: number;
    export let totalTime: number;
    export let totalTimeRawInput: string;
    export let averageSplitRawInput: string;

    const redo = () => {
        if ($redoStates.length > 0) {
            undoStates.update((value) => {
                value.push({ intervals: $intervals, distance: $distance });
                return value;
            });

            redoStates.update((value) => {
                const redoState = value.pop();

                intervals.set(redoState.intervals);
                distance.set(redoState.distance);

                return value;
            });

            distanceRawInput = $distance.toString();

            averageSplit = $intervals
                ? calculateAverageSplit($intervals, $distance)
                : 0;
            totalTime = (averageSplit / 500) * $distance;
            totalTimeRawInput = formatMillisecondsAsTimestamp(totalTime);
            averageSplitRawInput = formatMillisecondsAsTimestamp(averageSplit);
        }
    };
</script>

<button
    on:click={redo}
    class="text-white bg-zinc-600 font-medium rounded-md text-sm p-3 lg:px-5 lg:py-2.5 dark:bg-zinc-500 transition-colors {$redoStates.length ===
    0
        ? 'dark:opacity-20 opacity-50 !cursor-not-allowed'
        : 'dark:hover:bg-zinc-600 hover:bg-zinc-700'}"
    disabled={$redoStates.length === 0}
    aria-label="Redo last edit"
>
    <div class="w-5 h-5">
        <FaRedoAlt />
    </div>
</button>
