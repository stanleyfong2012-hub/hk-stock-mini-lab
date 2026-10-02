import yfinance as yf
import matplotlib.pyplot as plt

ticker = "0700.HK"
df = yf.download(ticker, period="1y", auto_adjust=True)

fig, (ax1, ax2) = plt.subplots(2, 1, sharex=True, figsize=(10, 6),
                               gridspec_kw={"height_ratios": [3, 1]})
ax1.plot(df.index, df["Close"], label="Close")
ax1.set_title(f"{ticker} — Close")
ax1.legend()
ax1.grid(True, alpha=0.3)

ax2.bar(df.index, df["Volume"].values.ravel(), width=1.0)
ax2.set_title("Volume")
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()