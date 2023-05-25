<script lang="ts">
    export let showing: boolean;
    export let message: string;
    export let topPositioning: string = "-top-full";
    export let top: boolean = true;

    // TODO: Add automatic top positioning based on the number of lines
</script>

<div class="relative inline-block z-50">
    <slot />
    <div
        class="absolute {topPositioning} text-sm text-white {showing
            ? 'opacity-100'
            : 'opacity-0'} transition-opacity duration-150 ease"
    >
        <div
            class="bg-zinc-600 dark:bg-zinc-700 rounded-lg px-3 py-2 font-normal text-left shadow-md"
        >
            {message}
        </div>
        <div
            class="w-2 h-2 rotate-45 transform bg-zinc-600 dark:bg-zinc-700 absolute left-1/2 -translate-x-1/2 {top
                ? '-bottom-1'
                : '-top-1'}"
        />
    </div>
</div>
