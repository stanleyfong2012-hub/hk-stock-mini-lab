import re
from typing import Literal

import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="HK Stock Mini Lab API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://stanleyfong2012-hub.github.io",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/stock")
def stock_data(
    ticker: str = Query(default="0700.HK", min_length=1, max_length=20),
    period: Literal["6mo", "1y", "2y"] = Query(default="1y"),
) -> dict[str, object]:
    ticker = ticker.strip().upper()
    if not re.fullmatch(r"[A-Z0-9.^=_-]{1,20}", ticker):
        raise HTTPException(status_code=422, detail="Ticker contains unsupported characters.")

    try:
        prices = yf.download(
            ticker,
            period=period,
            auto_adjust=True,
            progress=False,
            threads=False,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Market data provider request failed.") from exc

    if prices.empty or "Close" not in prices:
        raise HTTPException(status_code=404, detail=f"No market data returned for {ticker}.")

    closing = prices["Close"]
    if isinstance(closing, pd.DataFrame):
        closing = closing.iloc[:, 0]

    closing = pd.to_numeric(closing, errors="coerce").dropna().sort_index()
    if closing.empty:
        raise HTTPException(status_code=404, detail=f"No market data returned for {ticker}.")

    return {
        "ticker": ticker,
        "period": period,
        "prices": [
            {"date": index.strftime("%Y-%m-%d"), "close": float(value)}
            for index, value in closing.items()
        ],
    }