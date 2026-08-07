import React from "react";
import { fmt, formatDatePretty } from "../lib/formatters";

export const Ledger = ({
    sortedEntries,
    privacyMode,
    semanticColors,
}) => {
    if (sortedEntries.length === 0) return null;

    return (
        <div
            className="animate-in"
            style={{
                marginTop: 0,
                animationDelay: "0.6s",
                border: "3px solid #b7b2ae",
                padding: 0,
                position: "relative",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                minHeight: 0,
            }}
        >
            <div
                style={{
                    fontSize: 9,
                    color: "#b7b2ae",
                    padding: "16px 24px",
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #b7b2ae"
                }}
            >
                <span>TRANSACTION_LEDGER // HISTORY</span>
                <span>DATA_POINTS: {sortedEntries.length}</span>
            </div>
            <div
                style={{
                    height: 266,
                    overflowY: "auto",
                    padding: "0",
                }}
            >
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    padding: "0",
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                    borderBottom: "3px solid #b7b2ae",
                    background: "#b7b2ae",
                    color: "#111"
                }}>
                    <div style={{ padding: "12px 24px", borderRight: "1px solid #111" }}>TIMESTAMP</div>
                    <div style={{ padding: "12px 24px", borderRight: "1px solid #111" }}>DELTA</div>
                    <div style={{ padding: "12px 24px", textAlign: "right" }}>BALANCE</div>
                </div>

                {[...sortedEntries]
                    .reverse()
                    .slice(0, 20)
                    .map((e, i) => {
                        const idx = sortedEntries.findIndex((x) => x.date === e.date);
                        const prev = idx > 0 ? sortedEntries[idx - 1] : null;
                        const change = prev ? e.balance - prev.balance : 0;
                        const isPos = change >= 0;

                        return (
                            <div
                                key={e.date}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    alignItems: "center",
                                    borderBottom: "1px solid #b7b2ae",
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 13,
                                    padding: 0,
                                    transition: "background 0.2s"
                                }}
                                onMouseEnter={(ev) => (ev.currentTarget.style.background = "rgba(183,178,174,0.08)")}
                                onMouseLeave={(ev) => (ev.currentTarget.style.background = "transparent")}
                            >
                                <div style={{ color: "#b7b2ae", padding: "12px 24px", borderRight: "1px solid #b7b2ae" }}>
                                    {formatDatePretty(e.date).toUpperCase()}
                                </div>

                                <div style={{
                                    color: "#b7b2ae",
                                    padding: "12px 24px",
                                    borderRight: "1px solid #b7b2ae"
                                }}>
                                    {prev ? (
                                        <>
                                            {isPos ? "+" : ""}{privacyMode ? "$****" : `$${fmt(change)}`}
                                        </>
                                    ) : (
                                        <span style={{ color: "#b7b2ae" }}>INIT</span>
                                    )}
                                </div>

                                <div style={{
                                    color: "#b7b2ae",
                                    fontWeight: 700,
                                    textAlign: "right",
                                    padding: "12px 24px"
                                }}>
                                    {privacyMode ? "$****" : `$${fmt(e.balance)}`}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};
