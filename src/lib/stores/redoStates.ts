import { writable } from "svelte/store";
import type { SaveState } from "../types";

const defaultValue: SaveState[] = [];

const redoStates = writable<SaveState[]>(defaultValue);

export default redoStates;
