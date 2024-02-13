<script lang="ts">
    import { savePreviousState } from "$lib/utils";

    import intervals from "$lib/stores/intervals";
    import distance from "$lib/stores/distance";

    import FaTrashAlt from "svelte-icons/fa/FaTrashAlt.svelte";

    const resetIntervals = () => {
        if (confirm("Are you sure you want to delete all the sections?")) {
            savePreviousState($intervals, $distance);
            intervals.set([]);
        }
    };
</script>

<button
    on:click={resetIntervals}
    class="text-white bg-red-600 hover:bg-red-700 font-medium rounded-md text-sm p-3 lg:px-5 lg:py-2.5 dark:bg-red-500 dark:hover:bg-red-700 transition-colors"
    aria-label="Remove all sections"
>
    <div class="w-5 h-5">
        <FaTrashAlt />
    </div>
</button>
