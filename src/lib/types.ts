export interface Interval {
    size: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    rawInput: string;
}

export interface SaveState {
    intervals: Interval[];
    distance: number;
}
