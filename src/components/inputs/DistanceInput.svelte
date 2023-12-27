<script lang="ts">
    import toast from "svelte-french-toast";

    import { blurOnEnter, savePreviousState } from "$lib/utils";

    import distance from "$lib/stores/distance";
    import intervals from "$lib/stores/intervals";

    const MIN_DISTANCE: number = 100;
    const MAX_DISTANCE: number = 100000;

    export let distanceRawInput: string;
    export let tutorialStage: number;

    const handleDistanceInput = (event) => {
        let enteredDistance = event.target.value;

        if (!enteredDistance.match(/^\d+$/)) return;
        if (parseInt(enteredDistance) < MIN_DISTANCE) {
            distance.set(MIN_DISTANCE);
            return;
        }
        if (enteredDistance > MAX_DISTANCE) {
            distance.set(MAX_DISTANCE);
            return;
        }

        savePreviousState($intervals, $distance);

        distance.set(parseInt(enteredDistance));
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

        distanceRawInput = $distance.toString();
    };
</script>

<div
    class="font-bold text-4xl lg:text-5xl flex items-center rounded-lg px-2 lg:py-3 py-2 dark:bg-zinc-700/[0.45] transition-colors text-zinc-800 dark:text-white {tutorialStage ===
    4
        ? 'z-50 bg-white'
        : 'bg-zinc-300/30 dark:focus-within:bg-zinc-700 focus-within:bg-zinc-600 focus-within:text-white'}"
>
    <span>(</span>
    <div
        class="relative min-w-[1em] w-min"
        aria-label="Change the total distance"
    >
        <span class="invisible whitespace-pre text-center">
            {distanceRawInput}
        </span>
        <input
            bind:value={distanceRawInput}
            on:input={handleDistanceInput}
            on:blur={handleDistanceBlur}
            on:keypress={blurOnEnter}
            class="bg-transparent outline-none absolute inset-0 w-full text-center"
            aria-label="Edit distance"
            maxlength="6"
        />
    </div>
    <span>m)</span>
</div>
