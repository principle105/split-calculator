<script lang="ts">
    import toast from "svelte-french-toast";

    import { savePreviousState } from "$lib/utils";
    import { SMALLEST_INTERVAL_SIZE, DEFAULT_INTERVAL } from "$lib/constants";

    import intervals from "$lib/stores/intervals";
    import distance from "$lib/stores/distance";

    import FaPlus from "svelte-icons/fa/FaPlus.svelte";

    const MAX_INTERVALS: number = 8;

    const addSection = () => {
        if ($intervals.length >= MAX_INTERVALS) {
            toast.error(`You can have a maximum of ${MAX_INTERVALS} sections`);
            return;
        }

        savePreviousState($intervals, $distance);

        for (let i = $intervals.length - 1; i >= 0; i--) {
            if (Math.round($intervals[i].size) > SMALLEST_INTERVAL_SIZE * 2) {
                $intervals[i].size -= SMALLEST_INTERVAL_SIZE;
                break;
            }
        }

        const newInterval = {
            ...DEFAULT_INTERVAL,
            size: SMALLEST_INTERVAL_SIZE,
        };

        intervals.update((value) => {
            return {
                ...value,
                newInterval,
            };
        });
    };
</script>

<button
    on:click={addSection}
    class="text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-md text-sm p-3 lg:px-5 lg:py-2.5 dark:bg-emerald-500 dark:hover:bg-emerald-700 transition-colors"
    aria-label="Add section"
>
    <div class="h-5 w-5">
        <FaPlus />
    </div>
</button>
