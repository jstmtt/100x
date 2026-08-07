import React, { useState, useEffect, useMemo } from "react";
import { parseCSV } from "./lib/parseCsv";
import { loadBenchmarksOncePerDay } from "./lib/benchmark";
import { HeaderStats } from "./components/HeaderStats";
import { ChartArea } from "./components/ChartArea";
import { Ledger } from "./components/Ledger";
import { MONTHS, fmt } from "./lib/formatters";

// --- GLOBAL STYLES ---
const INLINE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  /* ANIMATIONS */
  @keyframes pulse-soft { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* CLASSES */
  .animate-in {
    opacity: 0;
    animation: fadeSlideIn 0.5s ease-out forwards;
  }
  
  .glass-panel {
    background: #111111;
    border: 1px solid #333333;
  }

  .glass-tooltip {
    background: #111111;
    border: 1px solid #333;
    padding: 12px 16px;
    min-width: 160px;
    border-radius: 0;
  }

  .mono-num { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #b7b2ae; }
  
  .toggle-btn {
    background: transparent;
    border: 1px solid transparent;
    color: #b7b2ae;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .toggle-btn:hover { color: #fff; background: rgba(255,255,255,0.06); }
  .toggle-btn.active {
    background: rgba(255,255,255,0.05);
    color: #111;
    background: #b7b2ae;
  }

  .nav-btn {
      position: relative;
      background: #161616;
      border: 1px solid #333;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 600;
      color: #b7b2ae;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 1px;
  }
  .nav-btn:hover {
      background: #1a1a1a;
      color: #fff;
  }
  .nav-btn.active {
      background: #b7b2ae;
      color: #111;
      border-color: #b7b2ae;
  }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #333;  }
  ::-webkit-scrollbar-thumb:hover { background: #555; }
  body { 
    margin: 0;
    background: #161616;
    color: #a0a0a0;
    overflow: hidden;
  }
`;

async function loadFromStorage() {
  const res = await fetch(
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0RCmN9uf0TXrcan5bx33Yp-M_SP4KGF1mXBU_q_pc1YCjZMlFI30GjnPrP-fSJbKtY8vUZFRmqaZx/pub?gid=148955930&single=true&output=csv&t=" +
    Date.now()
  );
  const text = await res.text();
  return parseCSV(text);
}

export default function PortfolioTracker() {
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState("overall");
  const [loading, setLoading] = useState(true);

  // NEW STATES
  const [privacyMode, setPrivacyMode] = useState(false);
  const [hiddenMonths, setHiddenMonths] = useState(new Set());
  const [highlightedMonth, setHighlightedMonth] = useState(null);
  const [metric, setMetric] = useState("value");

  // NEW: State for tooltip to ensure it renders reliably
  const [hoveredMonthStats, setHoveredMonthStats] = useState(null);
  const [scrubbedPoint, setScrubbedPoint] = useState(null);
  const [showSp500, setShowSp500] = useState(false);
  const [showNasdaq, setShowNasdaq] = useState(false);
  const [benchmarks, setBenchmarks] = useState({ sp500: [], nasdaq: [] });

  const fetchData = async () => {
    setLoading(true);
    const e = await loadFromStorage();
    if (e) setEntries(e);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!showSp500 && !showNasdaq) return;

    const fetchBenchmarks = async () => {
      try {
        const data = await loadBenchmarksOncePerDay();
        setBenchmarks(data);
      } catch {
        setBenchmarks({ sp500: [], nasdaq: [] });
      }
    };

    fetchBenchmarks();
  }, [showSp500, showNasdaq]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );

  const monthsWithData = useMemo(() => {
    const s = new Set();
    sortedEntries.forEach((e) =>
      s.add(new Date(e.date + "T00:00:00").getMonth())
    );
    return s;
  }, [sortedEntries]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") {
        if (view === "overall") return;
        if (view === "100x") {
          setView("overall");
          return;
        }
        if (view === "overlay") {
          setView("100x");
          return;
        }

        const currentMonth = parseInt(view);
        if (!isNaN(currentMonth)) {
          for (let i = currentMonth - 1; i >= 0; i--) {
            if (monthsWithData.has(i)) {
              setView(String(i));
              return;
            }
          }
          setView("overlay");
        }
      }
      if (e.key === "ArrowRight") {
        if (view === "overall") {
          setView("100x");
          return;
        }
        if (view === "100x") {
          setView("overlay");
          return;
        }
        if (view === "overlay") {
          for (let i = 0; i < 12; i++) {
            if (monthsWithData.has(i)) {
              setView(String(i));
              return;
            }
          }
          return;
        }

        const currentMonth = parseInt(view);
        if (!isNaN(currentMonth)) {
          for (let i = currentMonth + 1; i < 12; i++) {
            if (monthsWithData.has(i)) {
              setView(String(i));
              return;
            }
          }
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [view, monthsWithData]);

  const effectiveStart = useMemo(
    () => (sortedEntries.length ? sortedEntries[0].balance : 0),
    [sortedEntries]
  );

  const chartData = useMemo(() => {
    if (!sortedEntries.length) return [];

    // --- OVERLAY MODE ---
    if (view === "overlay") {
      const dayMap = new Map();

      // 1. Calculate Baselines
      const monthBaselines = {};
      MONTHS.forEach((_, mIdx) => {
        const prevMonthEntries = sortedEntries.filter((e) => {
          const d = new Date(e.date + "T00:00:00");
          return d.getMonth() === mIdx - 1;
        });

        if (prevMonthEntries.length > 0) {
          monthBaselines[mIdx] =
            prevMonthEntries[prevMonthEntries.length - 1].balance;
        } else {
          const thisMonthEntries = sortedEntries.filter(
            (e) => new Date(e.date + "T00:00:00").getMonth() === mIdx
          );
          if (thisMonthEntries.length > 0) {
            monthBaselines[mIdx] = thisMonthEntries[0].balance;
          }
        }
      });

      // 2. Initialize Day 0
      const day0 = { label: "0" };
      monthsWithData.forEach((mIdx) => {
        const monthName = MONTHS[mIdx];
        const base = monthBaselines[mIdx];
        if (base !== undefined) {
          if (metric === "value") day0[monthName] = base;
          if (metric === "profit") day0[monthName] = 0;
          if (metric === "percent") day0[monthName] = 0;
        }
      });
      dayMap.set("0", day0);

      // 3. Process entries
      sortedEntries.forEach((e) => {
        const dObj = new Date(e.date + "T00:00:00");
        const dayKey = String(dObj.getDate()).padStart(2, "0");
        const mIdx = dObj.getMonth();
        const monthName = MONTHS[mIdx];
        const base = monthBaselines[mIdx];

        if (base === undefined) return;

        if (!dayMap.has(dayKey)) {
          dayMap.set(dayKey, { label: dayKey });
        }

        const entry = dayMap.get(dayKey);
        let val = e.balance;

        if (metric === "profit") val = e.balance - base;
        if (metric === "percent") val = ((e.balance - base) / base) * 100;

        entry[monthName] = val;
      });

      return Array.from(dayMap.values()).sort(
        (a, b) => parseInt(a.label) - parseInt(b.label)
      );
    }

    // --- OVERALL / 100x / SINGLE MONTH ---
    let dataToProcess = [];
    let baseline = effectiveStart;

    if (view === "overall" || view === "100x") {
      dataToProcess = sortedEntries;
      baseline = effectiveStart;
    } else {
      const mi = parseInt(view);
      dataToProcess = sortedEntries.filter(
        (e) => new Date(e.date + "T00:00:00").getMonth() === mi
      );

      if (dataToProcess.length) {
        const firstEntryIdx = sortedEntries.indexOf(dataToProcess[0]);
        const prevEntry =
          firstEntryIdx > 0 ? sortedEntries[firstEntryIdx - 1] : null;
        baseline = prevEntry ? prevEntry.balance : dataToProcess[0].balance;
      }
    }

    if (!dataToProcess.length) return [];

    const mapped = dataToProcess.map((e) => {
      let val = e.balance;
      const target = effectiveStart * 100;

      if (view === "100x" && metric === "percent") {
        val = (e.balance / target) * 100;
      } else if (metric === "profit") {
        val = e.balance - baseline;
      } else if (metric === "percent") {
        val = ((e.balance - baseline) / baseline) * 100;
      }

      return {
        label:
          view === "overall" || view === "100x"
            ? e.date.slice(5) // Just showing month and day briefly on axis instead of prettyDate
            : e.date.slice(8),
        date: e.date,
        originalBalance: e.balance,
        value: val,
        isBaseline: false,
      };
    });

    if (view !== "overall" && view !== "100x" && dataToProcess.length > 0) {
      if (metric !== "value") {
        if (Math.abs(mapped[0].value) > 0.0001) {
          const firstDate = new Date(dataToProcess[0].date);
          const prevDate = new Date(firstDate);
          prevDate.setDate(prevDate.getDate() - 1);

          mapped.unshift({
            label: "Start",
            date: prevDate.toISOString().split("T")[0],
            originalBalance: baseline,
            value: 0,
            isBaseline: true,
          });
        }
      } else {
        const firstEntryIdx = sortedEntries.indexOf(dataToProcess[0]);
        const prevEntry =
          firstEntryIdx > 0 ? sortedEntries[firstEntryIdx - 1] : null;

        if (prevEntry) {
          mapped.unshift({
            label: "Start",
            date: prevEntry.date,
            originalBalance: prevEntry.balance,
            value: prevEntry.balance,
            isBaseline: true,
          });
        }
      }
    }

    return mapped;
  }, [sortedEntries, view, effectiveStart, metric, monthsWithData]);

  const viewBaseline = useMemo(() => {
    if (view === "overall" || view === "100x") return effectiveStart;
    if (view === "overlay") return effectiveStart;

    const mi = parseInt(view);
    const monthEntries = sortedEntries.filter(
      (e) => new Date(e.date + "T00:00:00").getMonth() === mi
    );
    if (!monthEntries.length) return effectiveStart;

    const firstEntryIdx = sortedEntries.indexOf(monthEntries[0]);
    const prevEntry = firstEntryIdx > 0 ? sortedEntries[firstEntryIdx - 1] : null;
    return prevEntry ? prevEntry.balance : monthEntries[0].balance;
  }, [view, sortedEntries, effectiveStart]);

  const chartDataWithBenchmarks = useMemo(() => {
    if (
      !chartData.length ||
      view === "overlay" ||
      (!showSp500 && !showNasdaq)
    )
      return chartData;

    const getCloseOnOrBefore = (series, targetDate) => {
      let lo = 0;
      let hi = series.length - 1;
      let best = null;

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const curr = series[mid];
        if (curr.date <= targetDate) {
          best = curr;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      return best?.close ?? null;
    };

    const anchorDate = chartData[0]?.date;
    if (!anchorDate) return chartData;

    const spBaseClose = getCloseOnOrBefore(benchmarks.sp500, anchorDate);
    const nqBaseClose = getCloseOnOrBefore(benchmarks.nasdaq, anchorDate);
    const target100x = effectiveStart * 100;

    const mapBenchmark = (pointDate, baseClose, series) => {
      if (!baseClose) return null;
      const pointClose = getCloseOnOrBefore(series, pointDate);
      if (!pointClose) return null;

      const benchmarkValue = viewBaseline * (pointClose / baseClose);

      if (view === "100x" && metric === "percent") {
        return (benchmarkValue / target100x) * 100;
      }
      if (metric === "profit") return benchmarkValue - viewBaseline;
      if (metric === "percent") {
        return viewBaseline > 0
          ? ((benchmarkValue - viewBaseline) / viewBaseline) * 100
          : 0;
      }
      return benchmarkValue;
    };

    return chartData.map((point) => ({
      ...point,
      sp500Compare: mapBenchmark(point.date, spBaseClose, benchmarks.sp500),
      nasdaqCompare: mapBenchmark(point.date, nqBaseClose, benchmarks.nasdaq),
    }));
  }, [
    chartData,
    view,
    showSp500,
    showNasdaq,
    benchmarks,
    metric,
    viewBaseline,
    effectiveStart,
  ]);

  const stats = useMemo(() => {
    const last = sortedEntries.length
      ? sortedEntries[sortedEntries.length - 1]
      : null;
    const overallPnl =
      last && effectiveStart ? last.balance - effectiveStart : 0;
    const overallPct =
      effectiveStart > 0 ? (overallPnl / effectiveStart) * 100 : 0;
    const overallMulti =
      effectiveStart > 0 && last ? last.balance / effectiveStart : 0;

    let monthPnl = 0,
      monthPct = 0;

    if (view !== "overall" && view !== "100x" && view !== "overlay") {
      const mi = parseInt(view);
      const me = sortedEntries.filter(
        (e) => new Date(e.date + "T00:00:00").getMonth() === mi
      );
      if (me.length) {
        const firstEntryIdx = sortedEntries.indexOf(me[0]);
        const prevEntry =
          firstEntryIdx > 0 ? sortedEntries[firstEntryIdx - 1] : null;
        const startBalance = prevEntry ? prevEntry.balance : me[0].balance;

        monthPnl = me[me.length - 1].balance - startBalance;
        monthPct = startBalance > 0 ? (monthPnl / startBalance) * 100 : 0;
      }
    }

    let weeklyPct = 0;
    if (sortedEntries.length > 0) {
      const lastEntry = sortedEntries[sortedEntries.length - 1];
      const lastDate = new Date(lastEntry.date);
      lastDate.setDate(lastDate.getDate() - 7);
      const weekStr = lastDate.toISOString().split("T")[0];

      let weekAgoEntry = null;
      for (let i = sortedEntries.length - 1; i >= 0; i--) {
        if (sortedEntries[i].date <= weekStr) {
          weekAgoEntry = sortedEntries[i];
          break;
        }
      }
      if (!weekAgoEntry && sortedEntries.length > 0) weekAgoEntry = sortedEntries[0];

      if (weekAgoEntry && weekAgoEntry.balance > 0) {
        weeklyPct = ((lastEntry.balance - weekAgoEntry.balance) / weekAgoEntry.balance) * 100;
      }
    }

    // ORACLE PREDICTION
    let projectedDate = null;
    let avgDailyGrowth = 0;

    if (sortedEntries.length > 1) {
      const first = sortedEntries[0];
      const lastEntry = sortedEntries[sortedEntries.length - 1];
      const daysTotal =
        (new Date(lastEntry.date) - new Date(first.date)) /
        (1000 * 60 * 60 * 24);

      if (daysTotal > 0 && lastEntry.balance > first.balance) {
        avgDailyGrowth =
          Math.pow(lastEntry.balance / first.balance, 1 / daysTotal) - 1;
        const target = effectiveStart * 100;
        if (lastEntry.balance < target && avgDailyGrowth > 0) {
          const daysRemaining =
            Math.log(target / lastEntry.balance) / Math.log(1 + avgDailyGrowth);
          const finish = new Date();
          finish.setDate(finish.getDate() + daysRemaining);
          projectedDate = finish.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }
      }
    }

    return {
      overallPnl,
      overallPct,
      overallMulti,
      monthPnl,
      monthPct,
      currentBalance: last?.balance ?? 0,
      projectedDate,
      avgDailyGrowth,
      weeklyPct,
    };
  }, [sortedEntries, effectiveStart, view]);

  const scrubbedHeaderStats = useMemo(() => {
    if (!scrubbedPoint?.originalBalance) return null;

    const scrubbedBalance = scrubbedPoint.originalBalance;
    const scrubbedPnl = scrubbedBalance - effectiveStart;
    const scrubbedPct =
      effectiveStart > 0 ? (scrubbedPnl / effectiveStart) * 100 : 0;

    return {
      balance: scrubbedBalance,
      pnl: scrubbedPnl,
      pct: scrubbedPct,
      date: scrubbedPoint.date,
    };
  }, [scrubbedPoint, effectiveStart]);

  const activeHeaderBalance = scrubbedHeaderStats
    ? scrubbedHeaderStats.balance
    : stats.currentBalance;
  const activeHeaderPnl = scrubbedHeaderStats
    ? scrubbedHeaderStats.pnl
    : stats.overallPnl;
  const activeHeaderPct = scrubbedHeaderStats
    ? scrubbedHeaderStats.pct
    : stats.overallPct;
  const activeHeaderMulti =
    effectiveStart > 0 ? activeHeaderBalance / effectiveStart : 0;

  const themeColors = {
    primary: "#b7b2ae", // Requested white
    secondary: "#929292", // Slightly dimmed white
  };

  const semanticColors = {
    positive: "#b7b2ae", // Brutalist monochrome override
    negative: "#b7b2ae", // Brutalist monochrome override
  };

  // Check last data point for color logic
  const isPositiveValue =
    chartData.length > 0 &&
    chartData[chartData.length - 1].value >=
    (metric === "value" ? chartData[0].value : 0);

  // Is a specific month selected?
  const isMonthView = !["overall", "100x", "overlay"].includes(view);
  const selectedMonthName = isMonthView ? MONTHS[parseInt(view)] : "";

  return (
    <div
      style={{
        background: "#111111",
        height: "100vh",
        fontFamily: "'JetBrains Mono', monospace",
        color: "#a0a0a0",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{INLINE_STYLES}</style>

      {/* --- CONTENT CONTAINER --- */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 20px 24px 20px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          opacity: loading ? 0 : 1,
          transition: "opacity 0.3s ease",
          gap: "24px",
        }}
      >
        <HeaderStats
          activeHeaderBalance={activeHeaderBalance}
          scrubbedHeaderStats={scrubbedHeaderStats}
          stats={stats}
          activeHeaderPnl={activeHeaderPnl}
          activeHeaderPct={activeHeaderPct}
          activeHeaderMulti={activeHeaderMulti}
          semanticColors={semanticColors}
          themeColors={themeColors}
          privacyMode={privacyMode}
          setPrivacyMode={setPrivacyMode}
          metric={metric}
          setMetric={setMetric}
          view={view}
          setView={setView}
          isMonthView={isMonthView}
          selectedMonthName={selectedMonthName}
          effectiveStart={effectiveStart}
          loading={loading}
          fetchData={fetchData}
          MONTHS={MONTHS}
          monthsWithData={monthsWithData}
          fmt={fmt}
        />

        {/* PROGRESS HUD */}
        {effectiveStart > 0 && stats.currentBalance > 0 && (
          <div
            className="glass-panel animate-in"
            style={{
              padding: "16px 20px",
              animationDelay: "0.2s",
              border: "1px solid #333",
              background: "#161616",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              <span style={{ color: "#dcdcdc" }}>
                Progress to Target (
                {privacyMode ? "$****" : `$${fmt(effectiveStart * 100)}`})
              </span>
              <span
                className="mono-num"
                style={{ color: themeColors.primary, fontWeight: 600 }}
              >
                {((stats.overallMulti / 100) * 100).toFixed(3)}%
              </span>
            </div>

            <div
              style={{
                height: 4,
                background: "#333",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, (stats.overallMulti / 100) * 100)}%`,
                  background: themeColors.primary,
                  transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>

            {stats.projectedDate && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "#dcdcdc",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    background: themeColors.primary,
                  }}
                />
                Target hit by{" "}
                <span style={{ color: "#fff" }}>
                  {stats.projectedDate}
                </span>{" "}
                based on current velocity.
              </div>
            )}
          </div>
        )}

        <ChartArea
          chartDataWithBenchmarks={chartDataWithBenchmarks}
          chartData={chartData}
          view={view}
          loading={loading}
          themeColors={themeColors}
          metric={metric}
          setMetric={setMetric}
          privacyMode={privacyMode}
          setScrubbedPoint={setScrubbedPoint}
          hiddenMonths={hiddenMonths}
          setHiddenMonths={setHiddenMonths}
          highlightedMonth={highlightedMonth}
          setHighlightedMonth={setHighlightedMonth}
          monthsWithData={monthsWithData}
          showSp500={showSp500}
          setShowSp500={setShowSp500}
          showNasdaq={showNasdaq}
          setShowNasdaq={setShowNasdaq}
          isPositiveValue={isPositiveValue}
          stats={stats}
          effectiveStart={effectiveStart}
        />

        <Ledger
          sortedEntries={sortedEntries}
          privacyMode={privacyMode}
          semanticColors={semanticColors}
        />
      </div>
    </div>
  );
}
