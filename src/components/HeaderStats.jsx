import React from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import { fmt } from "../lib/formatters";

export const HeaderStats = ({
    activeHeaderBalance,
    scrubbedHeaderStats,
    stats,
    activeHeaderPnl,
    activeHeaderPct,
    activeHeaderMulti,
    isWinning,
    semanticColors,
    themeColors,
    privacyMode,
    setPrivacyMode,
    metric,
    setMetric,
    view,
    setView,
    isMonthView,
    selectedMonthName,
    effectiveStart,
    loading,
    fetchData,
    MONTHS,
    monthsWithData,
    fmt
}) => {
    // Current active month stats
    let activeMonthName = "";
    if (view !== "overall" && view !== "100x" && view !== "overlay") {
        activeMonthName = MONTHS[parseInt(view)];
    } else {
        // Find the latest month with data if we are in overall view
        const latestMonthIdx = Math.max(...Array.from(monthsWithData));
        activeMonthName = MONTHS[latestMonthIdx] || "CUR";
    }

    const mPnl = stats.monthPnl || 0;
    const mPct = stats.monthPct || 0;
    const oPnl = stats.overallPnl || 0;
    const oPct = stats.overallPct || 0;
    const multi = stats.overallMulti || 0;

    const renderPnl = (val, pct) => {
        const isPos = val >= 0;
        const color = isPos ? semanticColors.positive : semanticColors.negative;
        const sign = isPos ? "+" : "";
        return (
            <div style={{ color, fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span>{sign}{privacyMode ? "$****" : `$${fmt(Math.abs(val))}`}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color }}>
                    ({sign}{pct.toFixed(2)}%)
                </span>
            </div>
        );
    };

    return (
        <div
            className="animate-in"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                marginBottom: 32,
                border: "3px solid #b7b2ae",
                padding: "24px 24px 0 24px",
                position: "relative",
            }}
        >
            {/* MICRO COPY REF */}
            <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#b7b2ae", letterSpacing: "1px" }}>
                SYS.ACTIVE
            </div>
            {/* TOP TITLE ROW (Spans full width) */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                }}
            >
                <div
                    style={{
                        background: themeColors.primary,
                        color: "#000",
                        padding: "2px 6px",
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.5px",
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    LIVE
                </div>
                <span
                    style={{
                        color: "#a0a0a0",
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    Institutional Dashboard // Terminal V.1.0
                </span>
            </div>



            <div style={{
                height: 1,
                background: "#333",
                width: "100%",
                marginBottom: 24,
            }} />

            {/* MAIN BALANCE AREA */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    width: "100%",
                    marginBottom: 32,
                }}
            >
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: "#b7b2ae",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            fontFamily: "'JetBrains Mono', monospace",
                            marginBottom: 4,
                        }}
                    >
                        PROJECT 100X
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 4,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 36,
                                fontWeight: 600,
                                color: "#b7b2ae",
                                fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                            }}
                        >
                            $
                        </span>
                        <div
                            style={{
                                fontSize: 64,
                                fontWeight: 700,
                                color: "#b7b2ae",
                                lineHeight: 1,
                                fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                                letterSpacing: "-2px"
                            }}
                        >
                            {privacyMode ? (
                                "**,***"
                            ) : (
                                <AnimatedNumber
                                    value={
                                        scrubbedHeaderStats
                                            ? scrubbedHeaderStats.balance
                                            : activeHeaderBalance
                                    }
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* SECONDARY METRICS ROW */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid #b7b2ae",
                        alignSelf: "flex-end",
                    }}
                >
                    {/* MONTH P&L */}
                    {view !== "overall" && view !== "100x" && view !== "overlay" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 24px", borderRight: "1px solid #b7b2ae" }}>
                            <div style={{ color: "#b7b2ae", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }}>{activeMonthName}</div>
                            <div style={{ textAlign: "right", color: "#b7b2ae", fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                                {mPnl >= 0 ? "+" : ""}{privacyMode ? "$****" : `${fmt(mPnl)}`} <span style={{ fontSize: 12, fontWeight: 400 }}>({mPct >= 0 ? "+" : ""}{mPct.toFixed(2)}%)</span>
                            </div>
                        </div>
                    )}

                    {/* TOTAL P&L */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 24px", borderRight: "1px solid #b7b2ae" }}>
                        <div style={{ color: "#b7b2ae", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>TOTAL P&L</div>
                        <div style={{ color: "#b7b2ae", fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                            {oPnl >= 0 ? "+" : "-"}{privacyMode ? "$****" : `$${fmt(Math.abs(oPnl))}`} <span style={{ fontSize: 12, fontWeight: 400 }}>({oPct >= 0 ? "+" : ""}{oPct.toFixed(2)}%)</span>
                        </div>
                    </div>

                    {/* MULTIPLE */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 24px" }}>
                        <div style={{ color: "#b7b2ae", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>MULTIPLE</div>
                        <div style={{ color: "#111", background: "#b7b2ae", padding: "2px 8px", borderRadius: 9999, fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", display: "inline-block", textAlign: "center" }}>
                            {multi.toFixed(2)}x
                        </div>
                    </div>
                </div>
            </div>

            {/* NAVIGATION TABS WITH TOGGLES */}
            <div style={{
                width: "100%",
                display: "flex",
                gap: 0,
                overflowX: "auto"
            }}>
                <button
                    onClick={() => setView("overall")}
                    className={`nav-btn ${view === "overall" ? "active" : ""}`}
                    style={{ border: "none", borderRight: "1px solid #b7b2ae", borderRadius: 0, background: view === "overall" ? "#b7b2ae" : "transparent", color: view === "overall" ? "#111" : "#b7b2ae" }}
                >
                    Overall
                </button>
                <button
                    onClick={() => setView("100x")}
                    className={`nav-btn ${view === "100x" ? "active" : ""}`}
                    style={{ border: "none", borderRight: "1px solid #b7b2ae", borderRadius: 0, background: view === "100x" ? "#b7b2ae" : "transparent", color: view === "100x" ? "#111" : "#b7b2ae" }}
                >
                    100x Progress
                </button>
                <button
                    onClick={() => setView("overlay")}
                    className={`nav-btn ${view === "overlay" ? "active" : ""}`}
                    style={{ border: "none", borderRight: "1px solid #b7b2ae", borderRadius: 0, background: view === "overlay" ? "#b7b2ae" : "transparent", color: view === "overlay" ? "#111" : "#b7b2ae" }}
                >
                    Overlay
                </button>

                {MONTHS && MONTHS.map((m, i) => {
                    const has = monthsWithData && monthsWithData.has(i);
                    const active = view === String(i);

                    return (
                        <button
                            key={m}
                            onClick={() => has && setView(String(i))}
                            disabled={!has}
                            className={`nav-btn ${active ? "active" : ""}`}
                            style={{
                                opacity: has ? 1 : 0.3,
                                cursor: has ? "pointer" : "default",
                                border: "none",
                                borderRight: "1px solid #b7b2ae",
                                borderRadius: 0,
                                background: active ? "#b7b2ae" : "transparent",
                                color: active ? "#111" : "#b7b2ae",
                            }}
                        >
                            {m}
                        </button>
                    );
                })}

                <div style={{ flex: 1 }} />

                <div style={{ display: "flex", alignItems: "center", padding: "0 16px" }}>
                    <button
                        onClick={() => setPrivacyMode(!privacyMode)}
                        style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#b7b2ae",
                            fontSize: 22,
                            padding: "0 16px",
                            borderRight: "1px solid #b7b2ae",
                            borderLeft: "1px solid #b7b2ae",
                        }}
                        title="Toggle Privacy Mode"
                    >
                        {privacyMode ? "●" : "◎"}
                    </button>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        style={{
                            background: "transparent",
                            border: "none",
                            cursor: loading ? "default" : "pointer",
                            color: "#b7b2ae",
                            padding: "0 16px"
                        }}
                        title="Refresh Data"
                    >
                        <div
                            style={{
                                animation: loading ? "spin 1s linear infinite" : "none",
                                fontSize: 22,
                            }}
                        >
                            ↻
                        </div>
                    </button>
                </div>
            </div>
        </div >
    );
};
