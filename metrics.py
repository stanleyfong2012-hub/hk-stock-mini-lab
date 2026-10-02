import yfinance as yf
import numpy as np
import pandas as pd

ticker = "0700.HK"
close = yf.download(ticker, period="1y", auto_adjust=True)["Close"].squeeze()

daily = close.pct_change().dropna()
monthly = close.resample("ME").last().pct_change().dropna()

ann_vol = float(daily.std() * np.sqrt(252))
cum = (1 + daily).cumprod()
max_dd = float((cum / cum.cummax() - 1).min())

print(f"Ticker: {ticker}")
print(f"Daily return mean: {daily.mean():.4%}")
print(f"Monthly return mean: {monthly.mean():.4%}")
print(f"Ann. volatility: {ann_vol:.2%}")
print(f"Max drawdown: {max_dd:.2%}")