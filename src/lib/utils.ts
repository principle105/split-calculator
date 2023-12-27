import type { Interval, SaveState } from "./types";
import { UNDO_LIMIT } from "./constants";
import undoStates from "./stores/undoStates";
import redoStates from "./stores/redoStates";

export const blurOnEnter = (e) => {
    if (e.key === "Enter") {
        // @ts-ignore
        e.target.blur();
    }
};

export const getIntervalDistance = (size: number, distance: number) => {
    const minInc = Math.pow(10, Math.floor(Math.log10(distance))) / 100;

    return Math.round(Math.round((size / (100 * minInc)) * distance) * minInc);
};

export const parseTime = (time: string) => {
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

export const addTimeAndConvertToMilliseconds = (
    hours: number,
    minutes: number,
    seconds: number,
    milliseconds: number
) => {
    return (hours * 60 * 60 + minutes * 60 + seconds) * 1000 + milliseconds;
};

export const validateSplitTimestamp = (
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

export const formatSplitAsTimestamp = (v: Interval) => {
    let timestamp = `${v.minutes}:${v.seconds.toString().padStart(2, "0")}`;

    if (v.milliseconds > 0) {
        timestamp += `.${Math.floor(v.milliseconds / 100).toString()[0]}`;
    }

    return timestamp;
};

export const savePreviousState = (intervals: Interval[], distance: number) => {
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

    undoStates.update((value) => {
        value.push(newState);

        if (value.length > UNDO_LIMIT) {
            value.shift();
        }

        return value;
    });

    redoStates.set([]);
};

export const convertMilliseconds = (milliseconds: number) => {
    milliseconds = Math.abs(milliseconds);

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    const remainingMilliseconds = milliseconds % 1000;

    return [hours, minutes, seconds, remainingMilliseconds];
};

export const formatMillisecondsAsTimestamp = (milliseconds: number): string => {
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

export const calculateAverageSplit = (
    intervals: Interval[],
    distance: number
): number => {
    let total = 0;
    let totalDistance = 0;

    intervals.forEach((v, i) => {
        // Ensures that average only updates by increment
        let size = getIntervalDistance(v.size, distance) / distance;

        totalDistance += size * distance;

        const milliseconds = Math.floor(v.milliseconds / 100) * 100;

        total += ((v.minutes * 60 + v.seconds) * 1000 + milliseconds) * size;

        if (i === intervals.length - 1) {
            let difference = (distance - totalDistance) / distance;

            size += difference;
            total +=
                ((v.minutes * 60 + v.seconds) * 1000 + milliseconds) *
                difference;
        }

        v.size = size * 100;
    });

    // In milliseconds
    return Math.floor(total / 100) * 100;
};
