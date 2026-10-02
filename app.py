import streamlit as st
import yfinance as yf
import numpy as np
import pandas as pd

st.title("HK Stock Mini Lab")
ticker = st.sidebar.text_input("Ticker", "0700.HK")
period = st.sidebar.selectbox("Period", ["6mo", "1y", "2y"], index=1)

try:
    df = yf.download(ticker, period=period, auto_adjust=True, progress=False)
    if df.empty:
        st.warning(f"No market data returned for {ticker}.")
        st.stop()

    close = df["Close"]
    if isinstance(close, pd.DataFrame):
        close = close.iloc[:, 0]

    close = pd.to_numeric(close, errors="coerce").dropna().sort_index()
    close.name = "Close"
except Exception as exc:
    st.error(f"Unable to load price data: {exc}")
    st.stop()

daily = close.pct_change().dropna()
ann_vol = float(daily.std() * np.sqrt(252))
cum = (1 + daily).cumprod()
max_dd = float((cum / cum.cummax() - 1).min())

st.line_chart(close)
st.metric("Ann. volatility", f"{ann_vol:.2%}")
st.metric("Max drawdown", f"{max_dd:.2%}")
st.caption("學習用途，非投資建議。")