<script lang="ts">
    import {
        formatMillisecondsAsTimestamp,
        calculateAverageSplit,
    } from "$lib/utils";

    import undoStates from "$lib/stores/undoStates";
    import intervals from "$lib/stores/intervals";
    import distance from "$lib/stores/distance";
    import redoStates from "$lib/stores/redoStates";

    import FaUndoAlt from "svelte-icons/fa/FaUndoAlt.svelte";

    export let distanceRawInput: string;
    export let averageSplit: number;
    export let totalTime: number;
    export let totalTimeRawInput: string;
    export let averageSplitRawInput: string;

    const undo = () => {
        if ($undoStates.length > 0) {
            redoStates.update((value) => {
                value.push({ intervals: $intervals, distance: $distance });
                return value;
            });

            undoStates.update((value) => {
                const undoState = value.pop();

                intervals.set(undoState.intervals);
                distance.set(undoState.distance);

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
    on:click={undo}
    class="text-white bg-zinc-600 font-medium rounded-md text-sm p-3 lg:px-5 lg:py-2.5 dark:bg-zinc-500 transition-colors {$undoStates.length ===
    0
        ? 'dark:opacity-20 opacity-50 !cursor-not-allowed'
        : 'hover:bg-zinc-700 dark:hover:bg-zinc-600'}"
    disabled={$undoStates.length === 0}
    aria-label="Undo last edit"
>
    <div class="w-5 h-5">
        <FaUndoAlt />
    </div>
</button>
