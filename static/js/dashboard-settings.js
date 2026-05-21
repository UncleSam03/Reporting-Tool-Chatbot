async function loadSettings() {
    const { reports, source } = await fetchReports();
    showDataSource(source);
    const count = document.getElementById("export-report-count");
    if (count) count.textContent = formatNumber(reports.length);
}

document.addEventListener("DOMContentLoaded", () => {
    loadSettings().catch((e) => console.error(e));
    const btn = document.getElementById("btn-export-json");
    if (btn) {
        btn.addEventListener("click", async () => {
            const res = await fetch("/api/reports");
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "hff-reports-export.json";
            a.click();
        });
    }
});
