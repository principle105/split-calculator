<script lang="ts">
    import FaGithub from "svelte-icons/fa/FaGithub.svelte";

    export let tutorialStage: number;
</script>

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
