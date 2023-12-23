<script lang="ts">
    import { onMount } from "svelte";
    import { Pane, Splitpanes } from "svelte-splitpanes";
    import toast, { Toaster } from "svelte-french-toast";
    import LZString from "lz-string";

    import FaTrashAlt from "svelte-icons/fa/FaTrashAlt.svelte";
    import FaPlus from "svelte-icons/fa/FaPlus.svelte";
    import FaGithub from "svelte-icons/fa/FaGithub.svelte";
    import FaShareAlt from "svelte-icons/fa/FaShareAlt.svelte";
    import FaUndoAlt from "svelte-icons/fa/FaUndoAlt.svelte";
    import FaRedoAlt from "svelte-icons/fa/FaRedoAlt.svelte";
    import FaFileExport from "svelte-icons/fa/FaFileExport.svelte";
    import FaTimes from "svelte-icons/fa/FaTimes.svelte";

    import colors from "tailwindcss/colors";
    import "./global.css";

    interface Interval {
        size: number;
        minutes: number;
        seconds: number;
        milliseconds: number;
        rawInput: string;
    }

    interface SaveState {
        intervals: Interval[];
        distance: number;
    }

    interface TutorialText {
        title: string;
        description: string;
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
    const tutorialTexts: TutorialText[] = [
        {
            title: "View Your Sections",
            description:
                "Each section represents an interval of distance in your piece. Drag the bar to adjust its size.",
        },
        {
            title: "Edit Section",
            description:
                "Adjust the split of a section by editing the input box.",
        },
        {
            title: "Edit Section",
            description:
                "Add a new section by clicking the + button. Delete all sections by clicking the 🗑️ button. Use the undo and redo buttons to move between your edit history.",
        },
        {
            title: "Edit Distance",
            description:
                "Change the your piece's distance by editing the distance input box.",
        },
        {
            title: "Total Time",
            description:
                "View how long it would take to complete your piece. Edit it to scale the splits on your sections.",
        },
        {
            title: "Average Split",
            description:
                "View the average split of your piece. Edit it to scale the splits of your sections.",
        },
        {
            title: "Export Your Pieces",
            description:
                "Export your piece as an image and print it out. Use it as a reference during your workouts.",
        },
        {
            title: "Share Your Piece",
            description: "Share your piece with your friends or coaches.",
        },
    ];
    const UNDO_LIMIT = 100;

    let distance: number = 2000;
    let distanceRawInput: string = distance.toString();

    let intervals: Interval[] = [DEFAULT_INTERVAL];

    let isLoaded: boolean = false;
    let isDarkMode: boolean = false;
    let isVertical: boolean = window.innerWidth < 1024;

    let tutorialStage: number = 0;

    let undoStates: SaveState[] = [];
    let redoStates: SaveState[] = [];

    let averageSplit: number = 0;
    let totalTime: number = 0;

    let splitPaneElement: HTMLElement;

    let averageSplitRawInput: string = "";
    let totalTimeRawInput: string = "";

    $: intervals, updateIntervalsInStorage();
    $: distance, updateDistanceInStorage();
    $: isDarkMode, updateTheme();

    $: intervalDisplay = tutorialStage === 0 ? intervals : TUTORIAL_INTERVALS;

    $: minInc = Math.pow(10, Math.floor(Math.log10(distance))) / 100;

    $: (intervals, distance), updateAverageSplitAndTotalTime();

    const updateAverageSplitAndTotalTime = () => {
        const wasTotalTimeRawInputUpdated =
            totalTimeRawInput === formatMillisecondsAsTimestamp(totalTime);
        const wasAverageSplitRawInputUpdated =
            averageSplitRawInput ===
            formatMillisecondsAsTimestamp(averageSplit);

        averageSplit = intervals ? calculateTotalTime() : 0;
        totalTime = (averageSplit / 500) * distance;

        if (wasTotalTimeRawInputUpdated) {
            totalTimeRawInput = formatMillisecondsAsTimestamp(totalTime);
        }

        if (wasAverageSplitRawInputUpdated) {
            averageSplitRawInput = formatMillisecondsAsTimestamp(averageSplit);
        }
    };

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

        averageSplit = intervals ? calculateTotalTime() : 0;
        totalTime = (averageSplit / 500) * distance;

        averageSplitRawInput = formatMillisecondsAsTimestamp(averageSplit);
        totalTimeRawInput = formatMillisecondsAsTimestamp(totalTime);

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
        const [hours, minutes, seconds, remainingMilliseconds] =
            convertMilliseconds(milliseconds);
        const millisecondsDecimal = Math.floor(remainingMilliseconds / 100);

        const hoursPart = hours > 0 ? `${hours}:` : "";

        const minutesPart =
            hours > 0 || minutes > 9
                ? `${minutes}`.padStart(2, "0") + ":"
                : `${minutes}:`;
        const secondsPart = `${seconds}`.padStart(2, "0");
        const millisecondsPart = `.${millisecondsDecimal}`;

        return hoursPart + minutesPart + secondsPart + millisecondsPart;
    };

    const convertMilliseconds = (milliseconds: number) => {
        milliseconds = Math.abs(milliseconds);

        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor(
            (milliseconds % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
        const remainingMilliseconds = milliseconds % 1000;

        return [hours, minutes, seconds, remainingMilliseconds];
    };

    const addTimeAndConvertToMilliseconds = (
        hours: number,
        minutes: number,
        seconds: number,
        milliseconds: number
    ) => {
        return (hours * 60 * 60 + minutes * 60 + seconds) * 1000 + milliseconds;
    };

    const calculateTotalTime = (): number => {
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

    const formatSplitAsTimestamp = (v: Interval) => {
        let timestamp = `${v.minutes}:${v.seconds.toString().padStart(2, "0")}`;

        if (v.milliseconds > 0) {
            timestamp += `.${(v.milliseconds / 100).toString()[0]}`;
        }

        return timestamp;
    };

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

        return [minutes, seconds, milliseconds];
    };

    const getDistance = (size: number) => {
        return Math.round(
            Math.round((size / (100 * minInc)) * distance) * minInc
        );
    };

    const removeInterval = (index: number) => {
        savePreviousState();

        intervals.splice(index, 1);
        intervals = intervals;
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
            (distance / 500) * addTimeAndConvertToMilliseconds(0, 9, 59, 900);
        const maxTimeDisplay = formatMillisecondsAsTimestamp(maxMilliseconds);

        const minMilliseconds =
            (distance / 500) * addTimeAndConvertToMilliseconds(0, 0, 0, 100);
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

    const validateSplitTimestamp = (
        minutes: number,
        seconds: number,
        milliseconds: number
    ) => {
        if (isNaN(seconds) || isNaN(minutes) || isNaN(milliseconds)) {
            throw new Error("Invalid split, please input in the format 0:00.0");
        }

        if (minutes === 0 && seconds === 0 && milliseconds == 0) {
            throw new Error("Split must be at least 0:00.1");
        }

        if (milliseconds < 0 || milliseconds > 1000) {
            throw new Error("Milliseconds must only take up one decimal place");
        }

        if (seconds < 0 || seconds >= 60) {
            throw new Error("Seconds must be between 0 and 59");
        }

        if (minutes < 0 || minutes >= 10) {
            throw new Error("Minutes must be between 0 and 9");
        }
    };

    const handleSplitInput = (event, index: number) => {
        let enteredTime = event.target.value;

        const [minutes, seconds, milliseconds] = parseTime(enteredTime);

        try {
            validateSplitTimestamp(minutes, seconds, milliseconds);
        } catch (e) {
            return;
        }

        savePreviousState();

        intervals[index] = {
            ...intervals[index],
            seconds,
            minutes,
            milliseconds,
        };
    };

    const handleSplitBlur = (index: number) => {
        const [minutes, seconds, milliseconds] = parseTime(
            intervals[index].rawInput
        );

        try {
            validateSplitTimestamp(minutes, seconds, milliseconds);
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

        savePreviousState();

        distance = parseInt(enteredDistance);
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

        savePreviousState();

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

        savePreviousState();

        const averageSplitChangeFactor =
            addTimeAndConvertToMilliseconds(0, minutes, seconds, milliseconds) /
            averageSplit;

        scaleIntervals(averageSplitChangeFactor);
    };

    const scaleIntervals = (scaleFactor: number) => {
        intervals = intervals.map((interval) => {
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
                rawInput: formatMillisecondsAsTimestamp(newIntervalTime),
            };
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
        if (tutorialStage !== 0) return;

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

        savePreviousState();

        for (let i = intervals.length - 1; i >= 0; i--) {
            if (Math.round(intervals[i].size) > SMALLEST_INTERVAL_SIZE * 2) {
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

        toast.success("Share link copied to clipboard");
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

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const cellWidth = 200;
        const cellHeight = 60;
        const columns = 2;
        const rows = intervals.length + 1;
        const tableWidth = cellWidth * columns;
        const tableHeight = cellHeight * rows;

        canvas.width = tableWidth;
        canvas.height = tableHeight;

        // Drawing the dividers between each cell
        for (let i = 1; i < rows + 1; i++) {
            // Alternating row colours
            if (i % 2 === 0) {
                ctx.fillStyle = isDarkMode
                    ? colors.zinc[700]
                    : colors.zinc[200];
            } else {
                ctx.fillStyle = isDarkMode ? colors.zinc[600] : colors.white;
            }
            ctx.fillRect(0, (i - 1) * cellHeight, tableWidth, cellHeight);
        }

        ctx.font = "16px Arial";
        ctx.fillStyle = isDarkMode ? colors.white : colors.zinc[800];
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Row labels
        const labelX = cellWidth / 2;
        const labelY = cellHeight / 2;
        ctx.fillText("Distance", labelX, labelY);
        ctx.fillText("Split", labelX + cellWidth, labelY);

        let totalDistance = 0;

        // Adding a row for each interval
        for (let i = 0; i < rows - 1; i++) {
            const interval = intervals[i];
            const x = cellWidth / 2;
            const y = (i + 1) * cellHeight + cellHeight / 2;

            let distance = getDistance(interval.size);

            ctx.fillText(
                `${totalDistance}m - ${totalDistance + distance}m`,
                x,
                y
            );
            ctx.fillText(interval.rawInput.toString(), x + cellWidth, y);

            totalDistance += distance;
        }

        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");

        link.href = dataUrl;
        link.download = "split_calculator.png";
        link.click();

        toast.success("Successfully saved image");
    };

    const resetIntervals = () => {
        if (confirm("Are you sure you want to delete all the sections?")) {
            savePreviousState();
            intervals = [];
        }
    };

    const updateOrientation = () => {
        isVertical = window.innerWidth < 1024;
    };

    const undo = () => {
        if (undoStates.length > 0) {
            redoStates.push({ intervals, distance });
            const undoState = undoStates.pop();

            intervals = undoState.intervals;
            distance = undoState.distance;
            distanceRawInput = distance.toString();

            averageSplit = intervals ? calculateTotalTime() : 0;
            totalTime = (averageSplit / 500) * distance;
            totalTimeRawInput = formatMillisecondsAsTimestamp(totalTime);
            averageSplitRawInput = formatMillisecondsAsTimestamp(averageSplit);

            undoStates = undoStates;
            redoStates = redoStates;
        }
    };

    const redo = () => {
        if (redoStates.length > 0) {
            undoStates.push({ intervals, distance });
            const redoState = redoStates.pop();

            intervals = redoState.intervals;
            distance = redoState.distance;
            distanceRawInput = distance.toString();

            averageSplit = intervals ? calculateTotalTime() : 0;
            totalTime = (averageSplit / 500) * distance;
            totalTimeRawInput = formatMillisecondsAsTimestamp(totalTime);
            averageSplitRawInput = formatMillisecondsAsTimestamp(averageSplit);

            undoStates = undoStates;
            redoStates = redoStates;
        }
    };

    const savePreviousState = () => {
        const newState: SaveState = {
            intervals: JSON.parse(
                JSON.stringify(
                    intervals.map((interval, i) => ({
                        ...interval,
                        rawInput: formatSplitAsTimestamp(intervals[i]),
                    }))
                )
            ),
            distance,
        };

        undoStates.push(newState);

        if (undoStates.length > UNDO_LIMIT) {
            undoStates.shift();
        }

        undoStates = undoStates;
        redoStates = [];
    };
</script>

<svelte:window on:resize={updateOrientation} />

<Toaster toastOptions={{ className: "toast" }} />

<div
    class="absolute backdrop-filter backdrop-blur-lg bg-zinc-500/40 dark:bg-transparent inset-0 z-40 transition-opacity duration-300 {tutorialStage ===
        0 && 'opacity-0 invisible'}"
/>

<header
    class="lg:absolute w-full lg:w-auto lg:top-0 lg:right-0 flex justify-between items-center p-4 lg:p-8"
    id="loading"
>
    <div class="lg:hidden">
        <img
            src="./logo.png"
            alt="Split Calculator Rowing Logo"
            class="w-11 h-11"
        />
    </div>
    <div class="flex flex-col mt-0.5 lg:hidden">
        <div
            class="flex dark:bg-zinc-800 rounded-lg text-4xl p-1.5 dark:text-white text-zinc-800 font-bold mx-auto transition-colors {tutorialStage ===
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
        <h2
            class="flex justify-center text-xl lg:text-2xl text-zinc-700 text-center dark:text-zinc-400 mt-1"
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
                    disabled={intervals.length === 0}
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
                        disabled={intervals.length === 0}
                    />
                </div>
                <span>)</span>
            </div>
        </h2>
    </div>
    <button on:click={toggleTheme} aria-label="Change theme">
        {#if !isDarkMode}
            <svg
                class="w-8 h-8 lg:w-10 lg:h-10 text-zinc-800"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                ><path
                    d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                /></svg
            >
        {:else}
            <svg
                class="w-8 h-8 lg:w-10 lg:h-10 text-white"
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

<main
    class="m-auto w-full max-w-screen-xl px-4 grow flex lg:flex-col lg:justify-center gap-4 lg:gap-0"
>
    <h1
        class="text-4xl lg:text-5xl text-zinc-800 font-bold mb-[0.325rem] dark:text-white gap-1 md:gap-2.5 md:flex-row flex-col items-center justify-center hidden lg:flex"
    >
        <div>Split Calculator</div>
        <div
            class="flex items-center rounded-lg px-2 py-3 dark:bg-zinc-700/[0.45] transition-colors {tutorialStage ===
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
    </h1>

    <h2
        class="hidden lg:flex text-xl lg:text-2xl text-zinc-700 text-center dark:text-zinc-400 justify-center"
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
                disabled={intervals.length === 0}
            />
        </div>
        <div
            class="flex px-1 py-0.5 rounded-md transition-colors focus-within:bg-zinc-600 focus-within:text-white {tutorialStage ===
                6 && 'z-50 bg-white dark:bg-zinc-600 dark:text-white'}"
        >
            <span>(</span>
            <div class="relative min-w-[1em] w-min grow">
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
                    disabled={intervals.length === 0}
                />
            </div>
            <span>)</span>
        </div>
    </h2>

    <div
        class="flex mb-2.5 lg:mt-12 lg:justify-between flex-col gap-2 lg:flex-row"
    >
        <div
            class="flex gap-2 lg:flex-row flex-col {tutorialStage === 3 &&
                'z-50'}"
        >
            <button
                on:click={addSection}
                class="text-white bg-emerald-600 hover:bg-emerald-700 font-medium rounded-md text-sm p-3 lg:px-5 lg:py-2.5 dark:bg-emerald-500 dark:hover:bg-emerald-700 transition-colors"
                aria-label="Add section"
            >
                <div class="h-5 w-5">
                    <FaPlus />
                </div>
            </button>

            <button
                on:click={resetIntervals}
                class="text-white bg-red-600 hover:bg-red-700 font-medium rounded-md text-sm p-3 lg:px-5 lg:py-2.5 dark:bg-red-500 dark:hover:bg-red-700 transition-colors"
                aria-label="Remove all sections"
            >
                <div class="w-5 h-5">
                    <FaTrashAlt />
                </div>
            </button>
        </div>

        <div class="lg:grow flex justify-end lg:order-3">
            <div class="flex gap-2 lg:flex-row flex-col">
                <button
                    on:click={downloadSplitsAsImage}
                    class="text-white bg-rose-500 hover:bg-rose-600 font-medium rounded-md text-sm p-3 lg:px-5 lg:py-2.5 transition-colors {tutorialStage ===
                        7 && 'z-50'}"
                    aria-label="Export as image"
                >
                    <div class="w-5 h-5 lg:hidden">
                        <FaFileExport />
                    </div>
                    <span class="lg:inline hidden">Export as Image</span>
                </button>
                <div
                    class="items-center border border-indigo-400 rounded-md overflow-hidden text-sm hidden lg:flex bg-white dark:bg-zinc-800 {tutorialStage ===
                        8 && 'z-50'}"
                >
                    <div class="pl-2 pr-1 dark:text-white relative">
                        <span>{window.location.origin}/?i=N4lg</span>
                        <div
                            class="absolute bg-white dark:bg-zinc-800 h-full w-1 bottom-0 right-1"
                        />
                    </div>

                    <button
                        on:click={copyURLToClipboard}
                        class="text-white bg-indigo-600 hover:bg-indigo-700 font-medium px-3.5 py-[0.575rem] dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
                    >
                        Copy Share Link
                    </button>
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
            </div>
        </div>

        <div
            class="flex gap-2 lg:order-2 lg:flex-row flex-col {tutorialStage ===
                3 && 'z-50'}"
        >
            <button
                on:click={undo}
                class="text-white bg-zinc-600 font-medium rounded-md text-sm p-3 lg:px-5 lg:py-2.5 dark:bg-zinc-500 transition-colors {undoStates.length ===
                0
                    ? 'dark:opacity-20 opacity-50 !cursor-not-allowed'
                    : 'hover:bg-zinc-700 dark:hover:bg-zinc-600'}"
                disabled={undoStates.length === 0}
                aria-label="Undo last edit"
            >
                <div class="w-5 h-5">
                    <FaUndoAlt />
                </div>
            </button>
            <button
                on:click={redo}
                class="text-white bg-zinc-600 font-medium rounded-md text-sm p-3 lg:px-5 lg:py-2.5 dark:bg-zinc-500 transition-colors {redoStates.length ===
                0
                    ? 'dark:opacity-20 opacity-50 !cursor-not-allowed'
                    : 'dark:hover:bg-zinc-600 hover:bg-zinc-700'}"
                disabled={redoStates.length === 0}
                aria-label="Redo last edit"
            >
                <div class="w-5 h-5">
                    <FaRedoAlt />
                </div>
            </button>
        </div>
    </div>

    <!-- Split pane -->
    <div
        class="overflow-hidden rounded-md relative grow lg:flex-grow-0 mb-4 {tutorialStage ===
            1 && 'z-50 bg-white dark:bg-transparent'}"
    >
        <p
            class="py-[3.575rem] bg-zinc-300/30  text-zinc-800 font-medium dark:!bg-zinc-700 dark:!text-white h-full flex justify-center items-center"
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
                    horizontal={isVertical}
                >
                    {#each intervalDisplay as interval, i}
                        <Pane
                            minSize={SMALLEST_INTERVAL_SIZE}
                            size={interval.size}
                            class="px-2 flex lg:flex-col justify-center items-center lg:items-start gap-4 lg:gap-1 dark:!bg-zinc-700 !bg-transparent dark:!bg-opacity-100"
                        >
                            <h3 class="text-sm dark:text-white">
                                {distance ? getDistance(interval.size) : 0}m
                            </h3>

                            <input
                                type="text"
                                aria-label="Edit section split"
                                bind:value={interval.rawInput}
                                on:input={(e) => handleSplitInput(e, i)}
                                on:blur={() => handleSplitBlur(i)}
                                on:keypress={blurOnEnter}
                                maxlength="6"
                                class="outline-none w-full block max-w-[3.25rem] text-center rounded-md dark:text-white my-1 py-0.5 lg:py-2 !leading-6 {interval
                                    .rawInput.length > 4
                                    ? 'text-sm'
                                    : 'text-base'} {tutorialStage === 2
                                    ? 'z-50 dark:bg-zinc-500'
                                    : 'dark:bg-zinc-600 dark:focus:bg-zinc-500 focus:bg-zinc-600 focus:text-white'} transition-colors"
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
        {/if}
    </div>
</main>
<footer
    class="text-zinc-800 p-4 text-md lg:text-lg dark:text-white flex flex-col gap-3 lg:flex-row items-center justify-between absolute bottom-0 left-0 lg:right-0"
>
    <div class="hidden lg:block">
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
    <a
        class="lg:hidden"
        href="https://github.com/principle105/split-calculator"
        target="_blank"
        rel="noreferrer"
        aria-label="Github repository"
    >
        <div class="w-6 h-6">
            <FaGithub />
        </div>
    </a>
    <div class="flex items-center gap-1.5 lg:z-50">
        <span class="hidden lg:inline">Confused?</span>
        <button
            aria-label="Start tooltip tutorial"
            on:click={() => {
                tutorialStage = +!tutorialStage;
            }}
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

<div
    class="absolute bottom-2 lg:bottom-3 left-2 right-2 flex justify-center transition-opacity z-[60] duration-300 {tutorialStage ===
        0 && 'opacity-0 invisible'}"
>
    <div
        class="absolute bottom-full w-full max-w-screen-sm transition-opacity duration-500 bg-white dark:bg-zinc-850 rounded-lg p-4 lg:p-5 text-zinc-800 dark:text-white {tutorialStage !==
        0
            ? 'opacity-100'
            : 'opacity-0'}"
    >
        {#if tutorialStage !== 0}
            {@const tutorialText = tutorialTexts[tutorialStage - 1]}
            <div class="flex justify-between">
                <h3 class="text-lg lg:text-xl font-bold mb-2 lg:mb-3">
                    {tutorialText.title}
                </h3>
                <button
                    class="w-5 h-5 dark:text-white text-zinc-600"
                    aria-label="Close tutorial"
                    on:click={() => {
                        tutorialStage = 0;
                    }}
                >
                    <FaTimes />
                </button>
            </div>
            <div
                class="mb-2.5 lg:mb-4 text-zinc-600 dark:text-zinc-400 text-sm lg:text-base"
            >
                {tutorialText.description}
            </div>
        {/if}
        <div
            class="flex gap-3 items-center text-sm text-zinc-600 dark:text-zinc-400"
        >
            <button
                on:click={() => {
                    tutorialStage += 1;

                    if (tutorialStage > tutorialTexts.length) {
                        tutorialStage = 0;
                    }
                }}
                class="text-white bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-700 hover:bg-indigo-600 font-medium rounded-md py-2 px-3 lg:px-5 lg:py-2.5 transition-colors"
            >
                Next
            </button>
            <div>
                {tutorialStage} of {tutorialTexts.length}
            </div>
        </div>
    </div>
</div>
