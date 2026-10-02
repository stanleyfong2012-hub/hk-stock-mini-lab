# Hosting

The Pages site is available at <https://stanleyfong2012-hub.github.io/hk-stock-mini-lab/>. It runs as a static site and does not need a separate API service.

Import a CSV with `Date` and `Close` columns. `Adj Close` is also supported and is preferred when both closing-price columns are present. The ticker field labels the chart; the lookback control filters the imported history. Parsing and calculations run in the browser.

The GitHub Actions workflow deploys the `docs` directory on pushes to `main`. The repository's Pages source must be set to **GitHub Actions** under **Settings > Pages**. Chart.js and Papa Parse are loaded from jsDelivr, so an internet connection is needed to render the chart and parse CSV files.