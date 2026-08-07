export const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

export const OVERLAY_COLORS = [
    "#b7b2ae",
    "oklch(0.65 0.15 25)",
    "oklch(0.7 0.15 150)",
    "oklch(0.65 0.15 45)",
    "#818181",
    "#666666",
    "oklch(0.75 0.1 200)",
    "oklch(0.6 0.1 300)",
    "oklch(0.7 0.2 100)",
    "oklch(0.5 0.1 250)",
    "#929292",
    "#555555",
];

export const fmt = (n) => {
    if (n === null || n === undefined) return "";
    return n.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export const formatDatePretty = (dateStr) => {
    if (!dateStr || dateStr.includes("Start") || dateStr === "0") return dateStr;
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
