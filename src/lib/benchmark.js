export function getBenchmarkRefreshKey(now = new Date()) {
  const utc = new Date(now.toISOString());

  // Use prior trading-day snapshot until after US market close (~21:00 UTC).
  if (utc.getUTCHours() < 21) {
    utc.setUTCDate(utc.getUTCDate() - 1);
  }

  return utc.toISOString().slice(0, 10);
}

const BENCHMARK_CACHE_KEY = "marketstack_benchmark_cache_v1";
let benchmarkRequestPromise = null;

function isValidBenchmarkSeries(series) {
  return (
    Array.isArray(series) &&
    series.every(
      (row) =>
        row &&
        typeof row.date === "string" &&
        Number.isFinite(Number(row.close)) &&
        Number(row.close) > 0
    )
  );
}

export async function loadBenchmarksOncePerDay() {
  const refreshKey = getBenchmarkRefreshKey();

  if (benchmarkRequestPromise) {
    return benchmarkRequestPromise;
  }

  try {
    const cachedRaw = window.localStorage.getItem(BENCHMARK_CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      if (
        cached?.refreshKey === refreshKey &&
        isValidBenchmarkSeries(cached.sp500) &&
        isValidBenchmarkSeries(cached.nasdaq)
      ) {
        return {
          sp500: cached.sp500,
          nasdaq: cached.nasdaq,
        };
      }
    }
  } catch {
    // Ignore cache read errors and fetch fresh data.
  }

  benchmarkRequestPromise = (async () => {
    const accessKey = import.meta.env.VITE_MARKETSTACK_KEY;
    if (!accessKey) throw new Error("Missing VITE_MARKETSTACK_KEY");
    const dateFrom = new Date();
    dateFrom.setUTCFullYear(dateFrom.getUTCFullYear() - 2);
    const dateFromStr = dateFrom.toISOString().slice(0, 10);

    const res = await fetch(
      `https://api.marketstack.com/v1/eod?access_key=${accessKey}&symbols=SPY,QQQ&sort=ASC&date_from=${dateFromStr}&limit=1000`
    );

    if (!res.ok) throw new Error("Failed benchmark fetch");
    const data = await res.json();
    const rows = Array.isArray(data?.data) ? data.data : [];

    const mapped = rows
      .map((r) => {
        const symbol = String(r?.symbol || "").toUpperCase();
        const rawDate = String(r?.date || "").slice(0, 10);
        const close = Number(r?.close);
        if (!rawDate || !Number.isFinite(close) || close <= 0) return null;
        return { symbol, date: rawDate, close };
      })
      .filter(Boolean)
      .sort((a, b) => a.date.localeCompare(b.date));

    const sp500 = mapped
      .filter((r) => r.symbol.startsWith("SPY"))
      .map(({ date, close }) => ({ date, close }));
    const nasdaq = mapped
      .filter((r) => r.symbol.startsWith("QQQ"))
      .map(({ date, close }) => ({ date, close }));

    const payload = { sp500, nasdaq };

    try {
      window.localStorage.setItem(
        BENCHMARK_CACHE_KEY,
        JSON.stringify({ refreshKey, ...payload, fetchedAt: new Date().toISOString() })
      );
    } catch {
      // Ignore cache write errors.
    }

    return payload;
  })();

  try {
    return await benchmarkRequestPromise;
  } finally {
    benchmarkRequestPromise = null;
  }
}
