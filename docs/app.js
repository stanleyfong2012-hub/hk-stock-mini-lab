const form = document.querySelector("#stock-form");
const tickerInput = document.querySelector("#ticker");
const periodInput = document.querySelector("#period");
const loadButton = document.querySelector("#load-button");
const statusRow = document.querySelector("#status");
const statusText = document.querySelector("#status-text");
const chartCanvas = document.querySelector("#price-chart");
const chartEmpty = document.querySelector("#chart-empty");
let priceChart;

const periodLabels = { "6mo": "6 MONTHS", "1y": "1 YEAR", "2y": "2 YEARS" };

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
    let peak = 0;
    drawdown = 0;
    for (const value of returns) {
      cumulative *= 1 + value;
      peak = Math.max(peak, cumulative);
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

function updateDashboard(data) {
  const metrics = calculateMetrics(data.prices);
  const lastPrice = data.prices[data.prices.length - 1];

  renderChart(data.prices);
  document.querySelector("#chart-title").textContent = data.ticker;
  document.querySelector("#chart-range").textContent = periodLabels[data.period];
  document.querySelector("#volatility").textContent = formatPercent(metrics.volatility);
  document.querySelector("#drawdown").textContent = formatPercent(metrics.drawdown);
  document.querySelector("#latest-close").textContent = lastPrice.close.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  chartEmpty.hidden = true;
}

async function loadStock(event) {
  event.preventDefault();
  const apiBase = (window.HK_STOCK_API_URL || "").replace(/\/$/, "");
  if (!apiBase) {
    setStatus("Set the API URL in config.js before loading prices.", "error");
    return;
  }

  const ticker = tickerInput.value.trim().toUpperCase();
  const period = periodInput.value;
  const params = new URLSearchParams({ ticker, period });
  loadButton.disabled = true;
  setStatus("Fetching adjusted prices…", "loading");

  try {
    const response = await fetch(`${apiBase}/api/stock?${params}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || "The data request failed.");
    }
    if (!Array.isArray(result.prices) || result.prices.length === 0) {
      throw new Error("No price history was returned for this ticker.");
    }

    updateDashboard(result);
    setStatus(`${result.prices.length} daily observations · updated ${result.prices.at(-1).date}`, "success");
  } catch (error) {
    setStatus(error.message || "Unable to load market data.", "error");
  } finally {
    loadButton.disabled = false;
  }
}

form.addEventListener("submit", loadStock);
form.requestSubmit();