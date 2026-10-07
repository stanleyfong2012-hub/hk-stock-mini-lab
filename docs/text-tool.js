const sourceText = document.querySelector("#source-text");
const fileInput = document.querySelector("#text-file");
const cleanButton = document.querySelector("#clean-button");
const copyButton = document.querySelector("#copy-button");
const cleanedText = document.querySelector("#cleaned-text");
const wordCount = document.querySelector("#word-count");
const status = document.querySelector("#status");

function clean(text) {
  return text.replace(/\r\n?|\n/g, " ").trim().toLowerCase();
}

function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

function renderResult() {
  const result = clean(sourceText.value);
  cleanedText.textContent = result || "清理後的文字會顯示在這裡。";
  wordCount.textContent = String(countWords(result));
  copyButton.disabled = result.length === 0;
  status.textContent = "";
}

cleanButton.addEventListener("click", renderResult);

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  try {
    sourceText.value = await file.text();
    renderResult();
    status.textContent = `已讀取 ${file.name}`;
  } catch (error) {
    status.textContent = `無法讀取檔案：${error.message}`;
  }
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(clean(sourceText.value));
    status.textContent = "已複製清理後的文字。";
  } catch (error) {
    status.textContent = `無法複製文字：${error.message}`;
  }
});
