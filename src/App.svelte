<script lang="ts">
    import { Pane, Splitpanes } from "svelte-splitpanes";

    interface Section {
        size: number;
        minutes: number;
        seconds: number;
        rawInput: string;
    }

    let distance: number = 2000;

    const defaultInterval = {
        size: 100,
        minutes: 2,
        seconds: 0,
        rawInput: "2:00",
    };

    let values: Section[] = [defaultInterval];

    $: panesNumber = values.length;

    const handleResize = (event) => {
        values.forEach((value, i) => {
            values[i] = { ...value, size: event.detail[i].size };
        });
    };

    const formatSeconds = (totalSeconds) => {
        const seconds = Math.round(totalSeconds);
        const miliseconds = (totalSeconds - seconds) * 1000;

        let date = new Date(0);
        date.setSeconds(seconds);
        date.setMilliseconds(miliseconds);

        return date.toISOString().substring(15, 21);
    };

    const getAverage = () => {
        let total = 0;

        values.forEach(
            (v) => (total += ((v.minutes * 60 + v.seconds) * v.size) / 100)
        );

        return total;
    };

    $: average = values ? getAverage() : 0;

    const formatSplit = (v: Section) => {
        return `${v.minutes}:${v.seconds.toString().padStart(2, "0")}`;
    };

    const splitTime = (time: string) => {
        const parts = time.split(":");
        let minutes = parseInt(parts[0]);
        let seconds = parseInt(parts[1]);

        return [seconds, minutes];
    };

    const handleInput = (event, i: number) => {
        let enteredTime = event.target.value;

        const [seconds, minutes] = splitTime(enteredTime);

        if (minutes >= 0 && minutes < 10 && seconds >= 0 && seconds < 60) {
            values[i].seconds = seconds;
            values[i].minutes = minutes;
        }
    };

    const handleBlur = (i: number) => {
        values[i].rawInput = formatSplit(values[i]);
    };
</script>

<div class="m-auto w-5/6">
    <div class="grow">
        <main>
            <h1 class="text-5xl text-zinc-700 text-center font-bold mb-2">
                Split Calculator (<input
                    bind:value={distance}
                    style="width: {distance.toString().length}ch"
                    class="bg-transparent outline-none w-7"
                />m)
            </h1>
            <h2 class="text-2xl text-zinc-700 text-center">
                <span class="font-medium">
                    Total: {formatSeconds((average / 500) * distance)}</span
                >
                <span>({formatSeconds(average)})</span>
            </h2>
            <button
                on:click={() => {
                    if (panesNumber >= 0) values = [...values, defaultInterval];
                }}
                class="text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2"
            >
                Add Section
            </button>

            <div class="overflow-hidden rounded-md">
                <Splitpanes on:resize={handleResize} on:resized={handleResize}>
                    {#each values as v, i}
                        <Pane minSize={5} class="px-2 py-3">
                            <h4 class="text-sm mb-0.5">
                                {Math.round((v.size / 1000) * distance) * 10}m
                            </h4>

                            <input
                                type="text"
                                bind:value={v.rawInput}
                                on:input={(e) => handleInput(e, i)}
                                on:blur={() => handleBlur(i)}
                                maxlength="4"
                                class="outline-none w-full max-w-[3.25rem] py-2 text-center rounded-md mb-2"
                            />
                            <div>
                                <button
                                    on:click={() => {
                                        if (panesNumber > 0) {
                                            values.splice(i, 1);
                                            values = values;
                                        }
                                    }}
                                    class="text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm p-2 text-center inline-flex items-center"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 352 512"
                                        class="w-5 h-5"
                                        fill="currentColor"
                                        ><path
                                            d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </Pane>
                    {/each}
                </Splitpanes>
            </div>
        </main>
    </div>
</div>
<footer class="text-zinc-900 px-3 py-3 text-lg">
    <span>Made by:</span>
    <a
        class="text-indigo-400 hover:text-indigo-500 transition-color"
        href="https://github.com/principle105">principle105</a
    >
</footer>

<style global>
    @tailwind utilities;
    @tailwind components;
    @tailwind base;
</style>
