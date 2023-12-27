<script lang="ts">
    import FaTimes from "svelte-icons/fa/FaTimes.svelte";

    export let tutorialStage: number;

    interface TutorialText {
        title: string;
        description: string;
    }

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
                "Change your piece's distance by editing the distance input box.",
        },
        {
            title: "Total Time",
            description:
                "View how long it takes to complete your piece. Edit it to scale the splits on your sections.",
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
</script>

<div
    class="absolute backdrop-filter backdrop-blur-lg bg-zinc-500/40 dark:bg-transparent inset-0 z-40 transition-opacity duration-300 {tutorialStage ===
        0 && 'opacity-0 invisible'}"
/>

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
