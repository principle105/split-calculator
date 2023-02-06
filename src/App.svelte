<script lang="ts">
    import { Pane, Splitpanes } from "svelte-splitpanes";

    interface Section {
        size: number;
        minutes: number;
        seconds: number;
        rawInput: string;
    }

    const defaultInterval = {
        size: 100,
        minutes: 2,
        seconds: 0,
        rawInput: "2:00",
    };

    let distance: number = 2000;
    let values: Section[] = [defaultInterval];

    $: minInc = Math.pow(10, Math.floor(Math.log10(distance))) / 100;

    const handleResize = (event) => {
        values.forEach((value, i) => {
            values[i] = { ...value, size: event.detail[i].size };
        });
    };

    const formatSeconds = (totalSeconds: number) => {
        const seconds = Math.round(totalSeconds);
        const miliseconds = (totalSeconds - seconds) * 1000;

        let date = new Date(0);
        date.setSeconds(seconds);
        date.setMilliseconds(miliseconds);

        return date.toISOString().substring(15, 21);
    };

    const getAverage = () => {
        console.log("yes");
        let total = 0;
        let totalDistance = 0;

        values.forEach((v, i) => {
            // Ensures that average only updates by increment
            let size = getDistance(v.size) / distance;

            totalDistance += size * distance;

            total += (v.minutes * 60 + v.seconds) * size;

            if (i === values.length - 1) {
                let difference = (distance - totalDistance) / distance;

                size += difference;
                total += (v.minutes * 60 + v.seconds) * difference;
            }

            v.size = size * 100;
        });

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

    const getDistance = (size: number) => {
        return Math.round((size / (100 * minInc)) * distance) * minInc;
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
                    {formatSeconds((average / 500) * distance)}</span
                >
                <span>({formatSeconds(average)})</span>
            </h2>
            <button
                on:click={() => {
                    values = [...values, defaultInterval];
                }}
                class="text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2"
            >
                Add Section
            </button>

            <div class="overflow-hidden rounded-md">
                {#if values.length == 0}
                    <p
                        class="py-[3.25rem] text-center bg-zinc-100 text-zinc-800 font-medium"
                    >
                        You don't have any sections
                    </p>
                {/if}
                <Splitpanes on:resize={handleResize} on:resized={handleResize}>
                    {#each values as v, i}
                        <Pane minSize={5} class="px-2 py-3 flex flex-col gap-1">
                            <h4 class="text-sm">
                                {getDistance(v.size)}m
                            </h4>

                            <input
                                type="text"
                                bind:value={v.rawInput}
                                on:input={(e) => handleInput(e, i)}
                                on:blur={() => handleBlur(i)}
                                maxlength="4"
                                class="outline-none w-full max-w-[3.25rem] py-2 text-center rounded-md"
                            />
                            <button
                                on:click={() => {
                                    values.splice(i, 1);
                                    values = values;
                                }}
                                class="text-zinc-800 font-medium rounded-lg text-sm p-2 text-center inline-flex items-center"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 448 512"
                                    class="w-5 h-5"
                                    fill="currentColor"
                                >
                                    <path
                                        d="M32 464a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128H32zm272-256a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1-32 0zM432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16z"
                                    />
                                </svg>
                            </button>
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
        class="text-indigo-500 hover:text-indigo-600 transition-color font-medium"
        href="https://github.com/principle105"
        target="_blank"
        rel="noreferrer"
    >
        principle105
    </a>
</footer>

<style global>
    @tailwind utilities;
    @tailwind components;
    @tailwind base;
</style>
