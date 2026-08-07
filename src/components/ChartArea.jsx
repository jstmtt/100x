import React from "react";
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine,
} from "recharts";
import { fmt, formatDatePretty, MONTHS, OVERLAY_COLORS } from "../lib/formatters";

export const ChartArea = ({
    chartDataWithBenchmarks,
    chartData,
    view,
    loading,
    themeColors,
    metric,
    setMetric,
    privacyMode,
    setScrubbedPoint,
    hiddenMonths,
    setHiddenMonths,
    highlightedMonth,
    setHighlightedMonth,
    monthsWithData,
    showSp500,
    setShowSp500,
    showNasdaq,
    setShowNasdaq,
    isPositiveValue,
    stats,
    effectiveStart,
}) => {
    const get100xDomain = () => {
        if (view !== "100x") return ["auto", "auto"];
        const target = effectiveStart * 100;
        if (metric === "percent") return [0, 100];
        if (metric === "profit") return [0, target - effectiveStart];
        return [0, Math.max(target, stats.currentBalance * 1.1)];
    };

    const areaColor = isPositiveValue ? themeColors.primary : "#ef4444";

    const getAxisTickFormatter = (val) => {
        if (isNaN(val) || val === null || val === undefined) return "";
        const numVal = Number(val);

        if (privacyMode && (metric === "value" || metric === "profit"))
            return "****";
        if (metric === "percent") return `${numVal.toFixed(0)}%`;
        if (metric === "profit") {
            return (
                (numVal >= 0 ? "+" : "") +
                (Math.abs(numVal) >= 1000 ? (Math.abs(numVal) / 1000).toFixed(1) + "k" : Math.abs(numVal))
            );
        }
        return numVal >= 1000 ? (numVal / 1000).toFixed(1) + "k" : numVal.toLocaleString();
    };

    const CustomLegend = ({ payload }) => {
        return (
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    justifyContent: "center",
                    padding: "10px 0 0",
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                }}
            >
                {payload.filter(entry => entry.value !== "Portfolio").map((entry) => {
                    const isHidden = hiddenMonths.has(entry.value);
                    const isHighlighted = highlightedMonth === entry.value;
                    return (
                        <div
                            key={entry.value}
                            onClick={() => {
                                const newHidden = new Set(hiddenMonths);
                                if (isHidden) newHidden.delete(entry.value);
                                else newHidden.add(entry.value);
                                setHiddenMonths(newHidden);
                            }}
                            onMouseEnter={() => setHighlightedMonth(entry.value)}
                            onMouseLeave={() => setHighlightedMonth(null)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                cursor: "pointer",
                                opacity: isHidden ? 0.3 : 1,
                                padding: "4px 8px",
                                borderRadius: 4,
                                background: isHighlighted
                                    ? "rgba(255,255,255,0.08)"
                                    : "transparent",
                                transition: "all 0.2s",
                                border: isHighlighted
                                    ? `1px solid ${entry.color}`
                                    : "1px solid transparent",
                            }}
                        >
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: "#b7b2ae",
                                    boxShadow: isHighlighted ? `0 0 8px #b7b2ae` : "none",
                                }}
                            />
                            <span
                                style={{
                                    color: isHighlighted ? "#b7b2ae" : "#888",
                                    fontWeight: isHighlighted ? 600 : 400,
                                    transition: "color 0.2s",
                                }}
                            >
                                {entry.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const CustomTooltip = ({ active, payload, label, fmt }) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload;
        const val = payload[0].value;
        const bVal = payload[1]?.value;

        return (
            <div
                className="glass-tooltip"
                style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: "#a0a0a0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                }}
            >
                <div style={{ color: "#b7b2ae", marginBottom: 8, fontWeight: 700, fontSize: 12 }}>
                    {data.fullDate || label}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#666" }}>
                    <span style={{ color: "#b7b2ae" }}>■</span> PORT VALUE
                </div>
                <div style={{ color: "#b7b2ae", fontSize: 16, fontWeight: 600, marginTop: 4, marginBottom: 12 }}>
                    ${fmt(val)}
                </div>

                {bVal !== undefined && (
                    <>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#666" }}>
                            <span style={{ color: "#b7b2ae" }}>■</span> BENCHMARK
                        </div>
                        <div style={{ color: "#b7b2ae", fontSize: 16, fontWeight: 600, marginTop: 4 }}>
                            ${fmt(bVal)}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const dataToUse = chartDataWithBenchmarks; // Assuming dataToUse is chartDataWithBenchmarks

    return (
        <>

            {/* CHART CONTAINER */}
            <div
                className="glass-panel animate-in"
                style={{
                    padding: "24px",
                    height: 510,
                    position: "relative",
                    animationDelay: "0.3s",
                    border: "3px solid #b7b2ae",
                    background: "#161616",
                }}
            >
                {/* Decorative wireframe labels */}
                <div style={{ position: "absolute", top: 12, left: 16, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#b7b2ae", letterSpacing: "0.2em" }}>
                    GROWTH_PROJECTION_WIREFRAME_V2
                </div>

                {/* S&P and Nasdaq Chips (Top Center) */}
                {view !== "overlay" && (
                    <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8, zIndex: 10 }}>
                        {[
                            { key: "sp500", label: "S&P", color: "#b7b2ae", enabled: showSp500 },
                            { key: "nasdaq", label: "Nasdaq", color: "#b7b2ae", enabled: showNasdaq },
                        ].map((benchmark) => (
                            <div
                                key={benchmark.key}
                                onClick={() =>
                                    benchmark.key === "sp500"
                                        ? setShowSp500((prev) => !prev)
                                        : setShowNasdaq((prev) => !prev)
                                }
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    cursor: "pointer",
                                    opacity: benchmark.enabled ? 1 : 0.3,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    fontSize: 9,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    transition: "all 0.2s",
                                    border: benchmark.enabled ? `1px solid ${benchmark.color}` : "1px solid transparent",
                                }}
                            >
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: benchmark.color, boxShadow: benchmark.enabled ? `0 0 6px ${benchmark.color}` : "none" }} />
                                <span style={{ color: "#b7b2ae", fontWeight: benchmark.enabled ? 600 : 400, transition: "color 0.2s" }}>{benchmark.label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Toggles Instead of SCALE */}
                <div style={{ position: "absolute", top: 8, right: 16, display: "flex", border: "1px solid #b7b2ae", borderRadius: 0, overflow: "hidden", zIndex: 10 }}>
                    <button
                        onClick={() => setMetric("value")}
                        style={{ background: metric === "value" ? "#b7b2ae" : "transparent", color: metric === "value" ? "#111" : "#b7b2ae", border: "none", borderRight: "1px solid #b7b2ae", padding: "4px 8px", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", textTransform: "uppercase" }}
                    >Value</button>
                    <button
                        onClick={() => setMetric("profit")}
                        style={{ background: metric === "profit" ? "#b7b2ae" : "transparent", color: metric === "profit" ? "#111" : "#b7b2ae", border: "none", borderRight: "1px solid #b7b2ae", padding: "4px 8px", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", textTransform: "uppercase" }}
                    >Profit</button>
                    <button
                        onClick={() => setMetric("percent")}
                        style={{ background: metric === "percent" ? "#b7b2ae" : "transparent", color: metric === "percent" ? "#111" : "#b7b2ae", border: "none", padding: "4px 8px", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", textTransform: "uppercase" }}
                    >%</button>
                </div>

                <div style={{ position: "absolute", bottom: 16, right: 16, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#b7b2ae", letterSpacing: "0.2em", zIndex: 10 }}>
                    AXIS_X: TEMPORAL_QUANTUM [WEEK]
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={dataToUse}
                        margin={{ top: 60, right: 20, left: 0, bottom: 20 }}
                        onMouseMove={(e) => {
                            if (e && e.activePayload && e.activePayload.length > 0) {
                                setScrubbedPoint(e.activePayload[0].payload);
                            }
                        }}
                        onMouseLeave={() => setScrubbedPoint(null)}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#222"
                            vertical={true}
                            horizontal={true}
                        />
                        <XAxis
                            dataKey="label"
                            stroke="#444"
                            tick={{ fill: "#666", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                            tickLine={false}
                            axisLine={{ stroke: "#444" }}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#444"
                            tick={{ fill: "#666", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={getAxisTickFormatter}
                            domain={get100xDomain()}
                            width={60}
                        />
                        <Tooltip content={<CustomTooltip fmt={fmt} />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1, strokeDasharray: "4 4" }} />

                        {metric !== "value" && view !== "100x" && (
                            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                        )}

                        {view === "overlay" ? (
                            <>
                                {MONTHS.map((m, i) => {
                                    if (!monthsWithData.has(i)) return null;
                                    const isHidden = hiddenMonths.has(m);
                                    const isHighlighted = highlightedMonth === m;
                                    const opacity = highlightedMonth
                                        ? isHighlighted
                                            ? 1
                                            : 0.1
                                        : isHidden
                                            ? 0
                                            : 0.8;

                                    return (
                                        <Line
                                            key={m}
                                            type="monotone"
                                            dataKey={m}
                                            stroke={OVERLAY_COLORS[i % OVERLAY_COLORS.length]}
                                            strokeWidth={isHighlighted ? 3 : 1.5}
                                            strokeOpacity={opacity}
                                            dot={false}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                            connectNulls
                                            animationDuration={1000}
                                        />
                                    );
                                })}
                                <Legend content={<CustomLegend themeColors={themeColors} />} />
                            </>
                        ) : (
                            <>
                                <Legend content={<CustomLegend themeColors={themeColors} />} />

                                {/* S&P 500 Benchmark */}
                                {chartDataWithBenchmarks[0]?.snp500 !== undefined &&
                                    view === "overall" && (
                                        <Line
                                            type="stepAfter"
                                            dataKey="snp500"
                                            name="S&P 500"
                                            stroke="#444"
                                            strokeWidth={1}
                                            dot={false}
                                            activeDot={false}
                                            isAnimationActive={false}
                                        />
                                    )}

                                {/* Nasdaq Benchmark */}
                                {chartDataWithBenchmarks[0]?.nasdaq !== undefined &&
                                    view === "overall" && (
                                        <Line
                                            type="stepAfter"
                                            dataKey="nasdaq"
                                            name="Nasdaq"
                                            stroke="#444"
                                            strokeWidth={1}
                                            strokeDasharray="4 4"
                                            dot={false}
                                            activeDot={false}
                                            isAnimationActive={false}
                                        />
                                    )}

                                {/* Main Portfolio Line (Replaces Area in Terminal Mode) */}
                                <Line
                                    type="linear"
                                    dataKey="value"
                                    name="Portfolio"
                                    stroke={themeColors.primary}
                                    strokeWidth={1.5}
                                    dot={(props) => {
                                        const { cx, cy, payload } = props;
                                        // Only draw dots for non-padded real data points
                                        if (view === "100x" && payload.isPadded) return null;
                                        return (
                                            <rect
                                                x={cx - 1.5} y={cy - 1.5} width={3} height={3}
                                                fill="#161616" stroke={themeColors.primary} strokeWidth={1}
                                                key={`dot-${cx}-${cy}`}
                                            />
                                        );
                                    }}
                                    activeDot={{ r: 4, fill: themeColors.primary, stroke: "#b7b2ae", strokeWidth: 1 }}
                                    isAnimationActive={true}
                                    animationDuration={600}
                                    animationEasing="ease-out"
                                />

                                {/* Target Line for 100x View */}
                                {view === "100x" && (
                                    <Line
                                        type="linear"
                                        dataKey="targetPathVal"
                                        name="Target Path"
                                        stroke="oklch(0.65 0.2 45)"
                                        strokeWidth={1}
                                        strokeDasharray="4 4"
                                        dot={false}
                                        activeDot={false}
                                        isAnimationActive={false}
                                    />
                                )}
                            </>
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </>
    );
};
