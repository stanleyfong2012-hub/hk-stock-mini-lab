const tickerInput = document.querySelector("#ticker");
const periodInput = document.querySelector("#period");
const loadButton = document.querySelector("#load-button");
const fileInput = document.querySelector("#csv-file");
const statusRow = document.querySelector("#status");
const statusText = document.querySelector("#status-text");
const chartCanvas = document.querySelector("#price-chart");
const chartEmpty = document.querySelector("#chart-empty");
let priceChart;
let sourcePrices = [];

const periodLabels = { "6mo": "6 MONTHS", "1y": "1 YEAR", "2y": "2 YEARS" };
const periodMonths = { "6mo": 6, "1y": 12, "2y": 24 };

function setStatus(message, state = "") {
  statusText.textContent = message;
  statusRow.dataset.state = state;
}

function calculateMetrics(prices) {
  const returns = prices.slice(1).map((point, index) => point.close / prices[index].close - 1);
  let volatility = null;
  let drawdown = null;

  if (returns.length > 1) {
    const average = returns.reduce((sum, value) => sum + value, 0) / returns.length;
    const variance = returns.reduce((sum, value) => sum + (value - average) ** 2, 0) / (returns.length - 1);
    volatility = Math.sqrt(variance * 252);
  }

  if (returns.length > 0) {
    let cumulative = 1;
    let peak = null;
    drawdown = 0;
    for (const value of returns) {
      cumulative *= 1 + value;
      peak = peak === null ? cumulative : Math.max(peak, cumulative);
      drawdown = Math.min(drawdown, cumulative / peak - 1);
    }
  }

  return { volatility, drawdown };
}

function formatPercent(value) {
  return value === null ? "--" : `${(value * 100).toFixed(2)}%`;
}

function renderChart(prices) {
  if (!window.Chart) {
    throw new Error("The chart library did not load. Check your connection and try again.");
  }

  const context = chartCanvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 0, chartCanvas.clientHeight);
  gradient.addColorStop(0, "rgba(29, 119, 89, 0.2)");
  gradient.addColorStop(1, "rgba(29, 119, 89, 0)");

  if (priceChart) {
    priceChart.destroy();
  }

  priceChart = new Chart(context, {
    type: "line",
    data: {
      labels: prices.map((point) => point.date),
      datasets: [{
        data: prices.map((point) => point.close),
        borderColor: "#1d7759",
        backgroundColor: gradient,
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 10,
        fill: true,
        tension: 0.18,
      }],
    },
    options: {
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            label: (context) => ` ${context.parsed.y.toFixed(2)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: "#77837d", maxTicksLimit: 6, maxRotation: 0, autoSkip: true },
        },
        y: {
          position: "right",
          grid: { color: "rgba(28, 54, 43, 0.08)" },
          border: { display: false },
          ticks: {
            color: "#77837d",
            maxTicksLimit: 5,
            callback: (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 }),
          },
        },
      },
    },
  });
}

function filterPrices(prices, period) {
  const lastDate = new Date(`${prices[prices.length - 1].date}T00:00:00Z`);
  const cutoff = new Date(lastDate);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - periodMonths[period]);
  const filtered = prices.filter((point) => new Date(`${point.date}T00:00:00Z`) >= cutoff);
  return filtered.length ? filtered : prices;
}

function updateDashboard() {
  const prices = filterPrices(sourcePrices, periodInput.value);
  const metrics = calculateMetrics(prices);
  const lastPrice = prices[prices.length - 1];

  renderChart(prices);
  document.querySelector("#chart-title").textContent = tickerInput.value.trim().toUpperCase();
  document.querySelector("#chart-range").textContent = periodLabels[periodInput.value];
  document.querySelector("#volatility").textContent = formatPercent(metrics.volatility);
  document.querySelector("#drawdown").textContent = formatPercent(metrics.drawdown);
  document.querySelector("#latest-close").textContent = lastPrice.close.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  chartEmpty.hidden = true;
}

function parseCsv(file) {
  if (!window.Papa) {
    setStatus("The CSV parser did not load. Check your connection and try again.", "error");
    return;
  }

  loadButton.disabled = true;
  setStatus(`Reading ${file.name}…`, "loading");

  window.Papa.parse(file, {
    header: true,
    skipEmptyLines: "greedy",
    complete(result) {
      try {
        const headers = result.meta.fields || [];
        const dateHeader = headers.find((header) => header.trim().toLowerCase() === "date");
        const closeHeader = headers.find((header) => header.trim().toLowerCase() === "adj close")
          || headers.find((header) => header.trim().toLowerCase() === "close");
        if (!dateHeader || !closeHeader) {
          throw new Error("CSV must include Date and Close columns (Adj Close is also supported).");
        }

        const pricesByDate = new Map();
        for (const row of result.data) {
          const rawDate = String(row[dateHeader] || "").trim();
          const parsedDate = new Date(rawDate);
          const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
            ? rawDate
            : Number.isNaN(parsedDate.getTime()) ? "" : parsedDate.toISOString().slice(0, 10);
          const close = Number(String(row[closeHeader] || "").replaceAll(",", "").trim());
          if (date && Number.isFinite(close) && close > 0) {
            pricesByDate.set(date, { date, close });
          }
        }

        sourcePrices = Array.from(pricesByDate.values()).sort((left, right) => left.date.localeCompare(right.date));
        if (sourcePrices.length === 0) {
          throw new Error("No valid dates and closing prices were found in this CSV.");
        }

        updateDashboard();
        const visiblePrices = filterPrices(sourcePrices, periodInput.value);
        setStatus(`${visiblePrices.length} observations · last date ${visiblePrices[visiblePrices.length - 1].date}`, "success");
      } catch (error) {
        setStatus(error.message || "Unable to read this CSV file.", "error");
      } finally {
        loadButton.disabled = false;
      }
    },
    error(error) {
      setStatus(error.message || "Unable to read this CSV file.", "error");
      loadButton.disabled = false;
    },
  });
}

loadButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    parseCsv(fileInput.files[0]);
  }
});
periodInput.addEventListener("change", () => {
  if (sourcePrices.length > 0) {
    updateDashboard();
    const visiblePrices = filterPrices(sourcePrices, periodInput.value);
    setStatus(`${visiblePrices.length} observations · last date ${visiblePrices[visiblePrices.length - 1].date}`, "success");
  }
});
tickerInput.addEventListener("input", () => {
  document.querySelector("#chart-title").textContent = tickerInput.value.trim().toUpperCase() || "TICKER";
});