<script lang="ts">
    import { Pane, Splitpanes } from "svelte-splitpanes";
    import toast from "svelte-french-toast";

    import {
        blurOnEnter,
        parseTime,
        getIntervalDistance,
        formatSplitAsTimestamp,
        validateSplitTimestamp,
        savePreviousState,
    } from "$lib/utils";
    import type { Interval } from "$lib/types";
    import { SMALLEST_INTERVAL_SIZE } from "$lib/constants";

    import intervals from "$lib/stores/intervals";
    import distance from "$lib/stores/distance";

    import FaTrashAlt from "svelte-icons/fa/FaTrashAlt.svelte";

    export let tutorialStage: number;

    const TUTORIAL_INTERVALS: Interval[] = [
        {
            size: 10,
            minutes: 1,
            seconds: 43,
            milliseconds: 0,
            rawInput: "1:43",
        },
        {
            size: 20,
            minutes: 1,
            seconds: 44,
            milliseconds: 0,
            rawInput: "1:44",
        },

        {
            size: 70,
            minutes: 1,
            seconds: 45,
            milliseconds: 0,
            rawInput: "1:45",
        },
    ];

    let splitPaneElement: HTMLElement;
    let isVertical: boolean = window.innerWidth < 1024;

    $: intervalDisplay = tutorialStage === 0 ? $intervals : TUTORIAL_INTERVALS;

    const updateOrientation = () => {
        isVertical = window.innerWidth < 1024;
    };

    const handleSplitInput = (event, index: number) => {
        let enteredTime = event.target.value;

        const [minutes, seconds, milliseconds] = parseTime(enteredTime);

        try {
            validateSplitTimestamp(minutes, seconds, milliseconds);
        } catch (e) {
            return;
        }

        savePreviousState($intervals, $distance);

        intervals.update((value) => {
            value[index] = {
                ...value[index],
                seconds,
                minutes,
                milliseconds,
            };

            return value;
        });
    };

    const handleSplitBlur = (index: number) => {
        const [minutes, seconds, milliseconds] = parseTime(
            $intervals[index].rawInput
        );

        try {
            validateSplitTimestamp(minutes, seconds, milliseconds);
        } catch (e) {
            toast.error(e.message);
        }

        intervals.update((value) => {
            value[index].rawInput = formatSplitAsTimestamp(value[index]);

            return value;
        });
    };

    const removeInterval = (index: number) => {
        savePreviousState($intervals, $distance);

        intervals.update((value) => {
            value.splice(index, 1);
            return value;
        });
    };

    const handleSectionResize = (event) => {
        if (tutorialStage !== 0) return;

        intervals.update((value) => {
            return value.map((interval, i) => ({
                ...interval,
                size: event.detail[i].size,
            }));
        });
    };
</script>

<svelte:window on:resize={updateOrientation} />

<div
    class="overflow-hidden rounded-md relative grow lg:flex-grow-0 mb-4 {tutorialStage ===
        1 && 'z-50 bg-white dark:bg-transparent'}"
>
    <p
        class="py-[3.575rem] bg-zinc-300/30  text-zinc-800 font-medium dark:!bg-zinc-700 dark:!text-white h-full flex justify-center items-center"
    >
        {#if $intervals.length == 0}
            You don't have any sections
        {:else}
            &nbsp
        {/if}
    </p>

    <div bind:this={splitPaneElement} class="absolute inset-0">
        <Splitpanes
            on:resize={handleSectionResize}
            on:resized={handleSectionResize}
            horizontal={isVertical}
        >
            {#each intervalDisplay as interval, i}
                <Pane
                    minSize={SMALLEST_INTERVAL_SIZE}
                    size={interval.size}
                    class="px-2 flex lg:flex-col justify-center items-center lg:items-start gap-4 lg:gap-1 dark:!bg-zinc-700 !bg-transparent dark:!bg-opacity-100"
                >
                    <h3 class="text-sm dark:text-white">
                        {$distance
                            ? getIntervalDistance(interval.size, $distance)
                            : 0}m
                    </h3>

                    <input
                        type="text"
                        aria-label="Edit section split"
                        bind:value={interval.rawInput}
                        on:input={(e) => handleSplitInput(e, i)}
                        on:blur={() => handleSplitBlur(i)}
                        on:keypress={blurOnEnter}
                        maxlength="6"
                        class="outline-none w-full block max-w-[3.25rem] text-center rounded-md dark:text-white my-1 py-0.5 lg:py-2 !leading-6 transition-colors {interval
                            .rawInput.length > 4
                            ? 'text-sm'
                            : 'text-base'} {tutorialStage === 2
                            ? 'z-50 dark:bg-zinc-500'
                            : 'dark:bg-zinc-600 dark:focus:bg-zinc-500 focus:bg-zinc-600 focus:text-white'}"
                    />
                    <div>
                        <button
                            on:click={() => {
                                removeInterval(i);
                            }}
                            aria-label="Remove section"
                            class="text-zinc-800 font-medium rounded-lg text-sm p-1 text-center inline-flex items-center dark:text-zinc-200 transition-colors"
                        >
                            <div class="w-4 h-4 lg:w-5 lg:h-5">
                                <FaTrashAlt />
                            </div>
                        </button>
                    </div>
                </Pane>
            {/each}
        </Splitpanes>
    </div>
</div>
