import yfinance as yf
import numpy as np
import pandas as pd

tickers = ["0700.HK", "2800.HK", "2823.HK"]
weights = np.array([0.4, 0.4, 0.2])

prices = yf.download(tickers, period="1y", auto_adjust=True)["Close"]
rets = prices.pct_change().dropna()

print("Correlation matrix:")
print(rets.corr().round(3))

port = rets @ weights
ann_ret = float(port.mean() * 252)
ann_vol = float(port.std() * np.sqrt(252))
cum = (1 + port).cumprod()
max_dd = float((cum / cum.cummax() - 1).min())

print(f"\nWeights: {dict(zip(tickers, weights))}")
print(f"Ann. return: {ann_ret:.2%}")
print(f"Ann. volatility: {ann_vol:.2%}")
print(f"Max drawdown: {max_dd:.2%}")