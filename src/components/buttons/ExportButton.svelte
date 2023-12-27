<script lang="ts">
    import toast from "svelte-french-toast";

    import { getIntervalDistance } from "$lib/utils";

    import intervals from "$lib/stores/intervals";
    import distance from "$lib/stores/distance";
    import isDarkMode from "$lib/stores/isDarkMode";

    import FaFileExport from "svelte-icons/fa/FaFileExport.svelte";

    import colors from "tailwindcss/colors";

    export let tutorialStage: number;

    const downloadSplitsAsImage = async () => {
        if ($intervals.length === 0) {
            toast.error("You don't have any sections");
            return;
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const cellWidth = 200;
        const cellHeight = 60;
        const columns = 2;
        const rows = $intervals.length + 1;
        const tableWidth = cellWidth * columns;
        const tableHeight = cellHeight * rows;

        canvas.width = tableWidth;
        canvas.height = tableHeight;

        // Drawing the dividers between each cell
        for (let i = 1; i < rows + 1; i++) {
            // Alternating row colours
            if (i % 2 === 0) {
                ctx.fillStyle = $isDarkMode
                    ? colors.zinc[700]
                    : colors.zinc[200];
            } else {
                ctx.fillStyle = $isDarkMode ? colors.zinc[600] : colors.white;
            }
            ctx.fillRect(0, (i - 1) * cellHeight, tableWidth, cellHeight);
        }

        ctx.font = "16px Arial";
        ctx.fillStyle = $isDarkMode ? colors.white : colors.zinc[800];
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Row labels
        const labelX = cellWidth / 2;
        const labelY = cellHeight / 2;
        ctx.fillText("Distance", labelX, labelY);
        ctx.fillText("Split", labelX + cellWidth, labelY);

        let totalDistance = 0;

        // Adding a row for each interval
        for (let i = 0; i < rows - 1; i++) {
            const interval = $intervals[i];
            const x = cellWidth / 2;
            const y = (i + 1) * cellHeight + cellHeight / 2;

            const intervalDistance = getIntervalDistance(
                interval.size,
                $distance
            );

            ctx.fillText(
                `${totalDistance}m - ${totalDistance + intervalDistance}m`,
                x,
                y
            );
            ctx.fillText(interval.rawInput.toString(), x + cellWidth, y);

            totalDistance += intervalDistance;
        }

        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");

        link.href = dataUrl;
        link.download = "split_calculator.png";
        link.click();

        toast.success("Successfully saved image");
    };
</script>

<button
    on:click={downloadSplitsAsImage}
    class="text-white bg-rose-500 hover:bg-rose-600 font-medium rounded-md text-sm p-3 lg:px-5 lg:py-2.5 transition-colors {tutorialStage ===
        7 && 'z-50'}"
    aria-label="Export as image"
>
    <div class="w-5 h-5 lg:hidden">
        <FaFileExport />
    </div>
    <span class="lg:inline hidden">Export as Image</span>
</button>
