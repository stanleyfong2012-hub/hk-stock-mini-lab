# Hosting

The GitHub Pages site uses the API service defined in `render.yaml` to fetch market data. The Pages URL is `https://stanleyfong2012-hub.github.io/hk-stock-mini-lab/` and the default Render API URL is `https://hk-stock-mini-lab-api.onrender.com`.

## First deployment

1. Push the changes on the `main` branch to the connected GitHub repository.
2. In Render, create a new Blueprint from that repository and deploy the `hk-stock-mini-lab-api` service. Confirm the service URL is `https://hk-stock-mini-lab-api.onrender.com`; if Render assigns a different URL, update `docs/config.js` to match and push that change.
3. In the GitHub repository, open **Settings > Pages** and set the build source to **GitHub Actions**.
4. The Pages workflow deploys on pushes to `main`. GitHub will show the resulting site URL in the workflow run.

The free Render service may take a short time to wake after inactivity. Yahoo Finance can also rate-limit requests; the site displays a request error if market data is temporarily unavailable.