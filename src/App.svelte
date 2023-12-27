<script lang="ts">
    import { onMount } from "svelte";
    import toast, { Toaster } from "svelte-french-toast";
    import LZString from "lz-string";

    import {
        formatSplitAsTimestamp,
        calculateAverageSplit,
        formatMillisecondsAsTimestamp,
        convertMilliseconds,
    } from "$lib/utils";
    import type { Interval } from "$lib/types";

    import intervals from "$lib/stores/intervals";
    import distance from "$lib/stores/distance";
    import isDarkMode from "$lib/stores/isDarkMode";

    import ExportButton from "$components/buttons/ExportButton.svelte";
    import ShareLinkButton from "$components/buttons/ShareLinkButton.svelte";
    import SplitPane from "$components/layout/SplitPane.svelte";
    import TimeInputs from "$components/inputs/TimeInputs.svelte";
    import ResetButton from "$components/buttons/ResetButton.svelte";
    import AddButton from "$components/buttons/AddButton.svelte";
    import UndoButton from "$components/buttons/UndoButton.svelte";
    import RedoButton from "$components/buttons/RedoButton.svelte";
    import ThemeToggleButton from "$components/buttons/ThemeToggleButton.svelte";
    import DistanceInput from "$components/inputs/DistanceInput.svelte";

    import Footer from "$components/layout/Footer.svelte";
    import TutorialPopup from "$components/layout/TutorialPopup.svelte";

    import "./global.css";

    let tutorialStage: number = 0;

    let averageSplit: number = 0;
    let totalTime: number = 0;

    let averageSplitRawInput: string = "";
    let totalTimeRawInput: string = "";
    let distanceRawInput: string = $distance.toString();

    isDarkMode.subscribe((value) => {
        if (value) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    });

    $: ($intervals, $distance), updateAverageSplitAndTotalTime();

    onMount(() => {
        loadShareURL();

        averageSplitRawInput = formatMillisecondsAsTimestamp(averageSplit);
        totalTimeRawInput = formatMillisecondsAsTimestamp(totalTime);
    });

    const updateAverageSplitAndTotalTime = () => {
        const wasTotalTimeRawInputUpdated =
            totalTimeRawInput === formatMillisecondsAsTimestamp(totalTime);
        const wasAverageSplitRawInputUpdated =
            averageSplitRawInput ===
            formatMillisecondsAsTimestamp(averageSplit);

        averageSplit = $intervals
            ? calculateAverageSplit($intervals, $distance)
            : 0;
        totalTime = (averageSplit / 500) * $distance;

        if (wasTotalTimeRawInputUpdated) {
            totalTimeRawInput = formatMillisecondsAsTimestamp(totalTime);
        }

        if (wasAverageSplitRawInputUpdated) {
            averageSplitRawInput = formatMillisecondsAsTimestamp(averageSplit);
        }
    };

    const loadShareURL = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedIntervals = urlParams.get("i");

        if (encodedIntervals) {
            window.history.replaceState(null, "", "/");

            try {
                const decodedData =
                    LZString.decompressFromEncodedURIComponent(
                        encodedIntervals
                    );
                const rawData = decodedData.split(",");

                let newIntervals: Interval[] = [];

                for (let i = 0; i < rawData.length - 1; i += 2) {
                    if (rawData[i] === "") break;

                    const [_, minutes, seconds, milliseconds] =
                        convertMilliseconds(parseFloat(rawData[i + 1]) * 10000);

                    let interval: Interval = {
                        size: parseFloat(rawData[i]),
                        minutes,
                        seconds,
                        milliseconds,
                        rawInput: "",
                    };
                    interval.rawInput = formatSplitAsTimestamp(interval);

                    newIntervals.push(interval);
                }

                distance.set(parseInt(rawData[rawData.length - 1]));
                distanceRawInput = $distance.toString();
                intervals.set(newIntervals);
            } catch (e) {
                toast.error("Failed to load splits from URL");
                return;
            }

            toast.success("Successfully loaded splits from URL");
        }
    };
</script>

<Toaster toastOptions={{ className: "toast" }} />

<header
    class="lg:absolute w-full lg:w-auto lg:top-0 lg:right-0 flex justify-between items-center p-4 lg:p-8"
>
    <div class="lg:hidden">
        <img
            src="./logo.png"
            alt="Split Calculator Rowing Logo"
            class="w-11 h-11"
        />
    </div>
    <div class="flex flex-col mt-0.5 lg:hidden gap-0.5">
        <DistanceInput bind:distanceRawInput bind:tutorialStage />

        <TimeInputs
            bind:averageSplit
            bind:averageSplitRawInput
            bind:totalTime
            bind:totalTimeRawInput
            bind:tutorialStage
        />
    </div>
    <ThemeToggleButton />
</header>

<main
    class="m-auto w-full max-w-screen-xl px-4 grow flex lg:flex-col lg:justify-center gap-4 lg:gap-0"
>
    <div
        class="mb-[0.325rem] gap-1 md:gap-2.5 md:flex-row flex-col items-center justify-center hidden lg:flex"
    >
        <h1 class="text-5xl font-bold text-zinc-800 dark:text-white">
            Split Calculator
        </h1>
        <DistanceInput bind:distanceRawInput bind:tutorialStage />
    </div>

    <div class="hidden lg:block">
        <TimeInputs
            bind:averageSplit
            bind:averageSplitRawInput
            bind:totalTime
            bind:totalTimeRawInput
            bind:tutorialStage
        />
    </div>

    <div
        class="flex mb-2.5 lg:mt-12 lg:justify-between flex-col gap-2 lg:flex-row"
    >
        <div
            class="flex gap-2 lg:flex-row flex-col {tutorialStage === 3 &&
                'z-50'}"
        >
            <AddButton />
            <ResetButton />
        </div>

        <div class="lg:grow flex justify-end lg:order-3">
            <div class="flex gap-2 lg:flex-row flex-col">
                <ExportButton bind:tutorialStage />
                <ShareLinkButton bind:tutorialStage />
            </div>
        </div>

        <div
            class="flex gap-2 lg:order-2 lg:flex-row flex-col {tutorialStage ===
                3 && 'z-50'}"
        >
            <UndoButton
                bind:averageSplit
                bind:averageSplitRawInput
                bind:distanceRawInput
                bind:totalTime
                bind:totalTimeRawInput
            />
            <RedoButton
                bind:averageSplit
                bind:averageSplitRawInput
                bind:distanceRawInput
                bind:totalTime
                bind:totalTimeRawInput
            />
        </div>
    </div>

    <SplitPane bind:tutorialStage />
</main>

<Footer bind:tutorialStage />

<TutorialPopup bind:tutorialStage />
