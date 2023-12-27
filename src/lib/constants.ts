import type { Interval } from "./types";

export const SMALLEST_INTERVAL_SIZE: number = 5;
export const DEFAULT_INTERVAL: Interval = {
    size: 100,
    minutes: 2,
    seconds: 0,
    milliseconds: 0,
    rawInput: "2:00",
};
export const UNDO_LIMIT: number = 100;
