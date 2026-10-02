import yfinance as yf
import pandas as pd

ticker = "0700.HK"
horizon = 5  # 訊號後 N 日

close = yf.download(ticker, period="2y", auto_adjust=True)["Close"].squeeze()
sma_s = close.rolling(20).mean()
sma_l = close.rolling(50).mean()

cross_up = (sma_s > sma_l) & (sma_s.shift(1) <= sma_l.shift(1))
fwd = close.pct_change(horizon).shift(-horizon)

signals = fwd[cross_up].dropna()
false_rate = (signals < 0).mean()

print(f"Ticker: {ticker}")
print(f"Golden-cross count: {len(signals)}")
print(f"Avg {horizon}d return after signal: {signals.mean():.2%}")
print(f"Win rate: {(signals > 0).mean():.1%}")
print(f"False-signal rate (neg return): {false_rate:.1%}")