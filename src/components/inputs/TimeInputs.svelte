<script lang="ts">
    import toast from "svelte-french-toast";

    import {
        blurOnEnter,
        parseTime,
        addTimeAndConvertToMilliseconds,
        validateSplitTimestamp,
        savePreviousState,
        formatMillisecondsAsTimestamp,
        convertMilliseconds,
    } from "$lib/utils";

    import intervals from "$lib/stores/intervals";
    import distance from "$lib/stores/distance";

    export let totalTimeRawInput: string;
    export let averageSplitRawInput: string;
    export let averageSplit: number;
    export let totalTime: number;
    export let tutorialStage: number;

    const parseTimeWithHours = (time: string) => {
        const colonSplitParts = time.split(":");
        let hours = 0;
        let minutes = 0;
        let seconds = 0;
        let milliseconds = 0;

        if (colonSplitParts.length > 2) {
            hours = parseInt(colonSplitParts[0]) || 0;
            minutes = parseInt(colonSplitParts[1]) || 0;
        } else if (colonSplitParts.length > 1) {
            minutes = parseInt(colonSplitParts[0]) || 0;
        }

        const decimalSplitParts =
            colonSplitParts[colonSplitParts.length - 1].split(".");

        seconds = parseInt(decimalSplitParts[0]) || 0;

        if (decimalSplitParts.length > 1 && decimalSplitParts[1] !== "") {
            milliseconds = parseInt(decimalSplitParts[1]) * 100;
        }

        return [hours, minutes, seconds, milliseconds];
    };

    const validateTotalTimeTimestamp = (
        hours: number,
        minutes: number,
        seconds: number,
        milliseconds: number
    ) => {
        if (
            isNaN(hours) ||
            isNaN(seconds) ||
            isNaN(minutes) ||
            isNaN(milliseconds)
        ) {
            throw new Error(
                "Invalid time, please input in the format 00:00:00.0"
            );
        }

        if (
            hours === 0 &&
            minutes === 0 &&
            seconds === 0 &&
            milliseconds == 0
        ) {
            throw new Error("Time must be at least 1 millisecond");
        }

        if (milliseconds < 0 || milliseconds > 1000) {
            throw new Error("Milliseconds must only take up one decimal place");
        }

        if (seconds < 0 || seconds >= 60) {
            throw new Error("Seconds must be between 0 and 59");
        }

        if (minutes < 0 || minutes >= 60) {
            throw new Error("Minutes must be between 0 and 59");
        }

        const maxMilliseconds =
            ($distance / 500) * addTimeAndConvertToMilliseconds(0, 9, 59, 900);
        const maxTimeDisplay = formatMillisecondsAsTimestamp(maxMilliseconds);

        const minMilliseconds =
            ($distance / 500) * addTimeAndConvertToMilliseconds(0, 0, 0, 100);
        const minTimeDisplay = formatMillisecondsAsTimestamp(minMilliseconds);

        const totalMilliseconds = addTimeAndConvertToMilliseconds(
            hours,
            minutes,
            seconds,
            milliseconds
        );

        // Checking if the average split would be above 9:59.9
        if (totalMilliseconds > maxMilliseconds) {
            throw new Error(
                `Total time is too large! Set it between ${maxTimeDisplay} and ${minTimeDisplay}.`
            );
        }

        // Checking if the average split would be above 0:00.1
        if (totalMilliseconds < minMilliseconds) {
            throw new Error(
                `Total time is too small! Set it between ${maxTimeDisplay} and ${minTimeDisplay}.`
            );
        }
    };

    const handleTotalTimeBlur = () => {
        const [hours, minutes, seconds, milliseconds] =
            parseTimeWithHours(totalTimeRawInput);

        try {
            validateTotalTimeTimestamp(hours, minutes, seconds, milliseconds);
        } catch (e) {
            toast.error(e.message);
        }

        totalTimeRawInput = formatMillisecondsAsTimestamp(totalTime);
    };

    const handleTotalTimeInput = (event) => {
        let enteredTime = event.target.value;

        const [hours, minutes, seconds, milliseconds] =
            parseTimeWithHours(enteredTime);

        try {
            validateTotalTimeTimestamp(hours, minutes, seconds, milliseconds);
        } catch (e) {
            return;
        }

        savePreviousState($intervals, $distance);

        const totalTimeChangeFactor =
            addTimeAndConvertToMilliseconds(
                hours,
                minutes,
                seconds,
                milliseconds
            ) / totalTime;

        scaleIntervals(totalTimeChangeFactor);
    };

    const handleAverageSplitInput = (event) => {
        let enteredTime = event.target.value;

        const [minutes, seconds, milliseconds] = parseTime(enteredTime);

        try {
            validateSplitTimestamp(minutes, seconds, milliseconds);
        } catch (e) {
            return;
        }

        savePreviousState($intervals, $distance);

        const averageSplitChangeFactor =
            addTimeAndConvertToMilliseconds(0, minutes, seconds, milliseconds) /
            averageSplit;

        scaleIntervals(averageSplitChangeFactor);
    };

    const scaleIntervals = (scaleFactor: number) => {
        intervals.update((value) => {
            return value.map((interval) => {
                const totalIntervalTime = addTimeAndConvertToMilliseconds(
                    0,
                    interval.minutes,
                    interval.seconds,
                    interval.milliseconds
                );

                const newIntervalTime = totalIntervalTime * scaleFactor;

                const [_, minutes, seconds, remainingMilliseconds] =
                    convertMilliseconds(newIntervalTime);

                return {
                    ...interval,
                    minutes,
                    seconds,
                    milliseconds: remainingMilliseconds,
                    rawInput: formatMillisecondsAsTimestamp(
                        newIntervalTime
                    ).replace(".0", ""),
                };
            });
        });
    };

    const handleAverageSplitBlur = () => {
        const [minutes, seconds, milliseconds] =
            parseTime(averageSplitRawInput);

        try {
            validateSplitTimestamp(minutes, seconds, milliseconds);
        } catch (e) {
            toast.error(e.message);
        }

        averageSplitRawInput = formatMillisecondsAsTimestamp(averageSplit);
    };
</script>

<h2
    class="flex justify-center text-xl lg:text-2xl text-zinc-700 text-center dark:text-zinc-400"
>
    <div
        class="relative min-w-[1em] w-min font-medium px-1.5 py-0.5 rounded-md transition-colors focus-within:bg-zinc-600 focus-within:text-white {tutorialStage ===
            5 && 'z-50 bg-white dark:bg-zinc-600 dark:text-white'}"
    >
        <span class="invisible whitespace-pre text-center">
            {totalTimeRawInput}
        </span>
        <input
            type="text"
            class="bg-transparent outline-none absolute inset-0 w-full text-center"
            aria-label="Edit total time"
            bind:value={totalTimeRawInput}
            on:blur={handleTotalTimeBlur}
            on:input={handleTotalTimeInput}
            on:keypress={blurOnEnter}
            maxlength="20"
            disabled={$intervals.length === 0}
        />
    </div>
    <div
        class="flex px-1 py-0.5 rounded-md w-min transition-colors focus-within:bg-zinc-600 focus-within:text-white {tutorialStage ===
            6 && 'z-50 bg-white dark:bg-zinc-600 dark:text-white'}"
    >
        <span>(</span>
        <div class="relative min-w-[1em]">
            <span class="invisible whitespace-pre">
                {averageSplitRawInput}
            </span>
            <input
                type="text"
                class="bg-transparent outline-none absolute inset-0 w-full"
                aria-label="Edit average split"
                bind:value={averageSplitRawInput}
                on:blur={handleAverageSplitBlur}
                on:input={handleAverageSplitInput}
                on:keypress={blurOnEnter}
                maxlength="6"
                disabled={$intervals.length === 0}
            />
        </div>
        <span>)</span>
    </div>
</h2>
