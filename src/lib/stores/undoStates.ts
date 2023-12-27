import { writable } from "svelte/store";
import type { SaveState } from "../types";

const defaultValue: SaveState[] = [];

const undoStates = writable<SaveState[]>(defaultValue);

export default undoStates;
