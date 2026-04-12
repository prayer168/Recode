/* QR Code Generator – app.js */

const urlInput     = document.getElementById('url-input');
const clearBtn     = document.getElementById('clear-btn');
const generateBtn  = document.getElementById('generate-btn');
const sizeSelect   = document.getElementById('size-select');
const colorPick    = document.getElementById('color-pick');
const bgPick       = document.getElementById('bg-pick');
const ecSelect     = document.getElementById('ec-select');
const resultSection = document.getElementById('result-section');
const qrCanvas     = document.getElementById('qr-canvas');
const downloadPng  = document.getElementById('download-png');
const copyBtn      = document.getElementById('copy-btn');
const urlDisplay   = document.getElementById('url-display');
const errorMsg     = document.getElementById('error-msg');
const errorText    = document.getElementById('error-text');
const toast        = document.getElementById('toast');

let toastTimer = null;

/* ── Helpers ── */
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

function showError(msg) {
  errorText.textContent = msg;
  errorMsg.classList.remove('hidden');
  resultSection.classList.add('hidden');
}

function hideError() {
  errorMsg.classList.add('hidden');
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/* ── Clear button visibility ── */
urlInput.addEventListener('input', () => {
  clearBtn.classList.toggle('visible', urlInput.value.length > 0);
  hideError();
});

clearBtn.addEventListener('click', () => {
  urlInput.value = '';
  clearBtn.classList.remove('visible');
  hideError();
  urlInput.focus();
});

/* ── Generate ── */
function generate() {
  const raw = urlInput.value.trim();

  if (!raw) {
    showError('請輸入網址。');
    return;
  }

  // Auto-prefix if user forgot the scheme
  const url = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;

  if (!isValidUrl(url)) {
    showError('網址格式不正確，請確認後再試。');
    return;
  }

  hideError();
  generateBtn.disabled = true;
  generateBtn.textContent = '生成中…';

  const size = parseInt(sizeSelect.value, 10);

  QRCode.toCanvas(qrCanvas, url, {
    width: size,
    margin: 2,
    color: {
      dark:  colorPick.value,
      light: bgPick.value,
    },
    errorCorrectionLevel: ecSelect.value,
  }, (err) => {
    generateBtn.disabled = false;
    // Restore button content
    generateBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      生成 QR Code`;

    if (err) {
      showError('生成失敗：' + err.message);
      return;
    }

    urlDisplay.textContent = url;
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

generateBtn.addEventListener('click', generate);

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') generate();
});

/* ── Download PNG ── */
downloadPng.addEventListener('click', () => {
  const link = document.createElement('a');
  const hostname = (() => {
    try { return new URL(urlInput.value.trim()).hostname.replace(/\./g, '_'); }
    catch { return 'qrcode'; }
  })();
  link.download = `qr_${hostname}.png`;
  link.href = qrCanvas.toDataURL('image/png');
  link.click();
  showToast('已下載 PNG 圖片');
});

/* ── Copy to clipboard ── */
copyBtn.addEventListener('click', async () => {
  try {
    const blob = await new Promise((resolve) =>
      qrCanvas.toBlob(resolve, 'image/png')
    );
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    showToast('已複製到剪貼簿');
  } catch {
    // Fallback: copy data URL as text
    try {
      await navigator.clipboard.writeText(qrCanvas.toDataURL('image/png'));
      showToast('已複製圖片資料');
    } catch {
      showToast('複製失敗，請手動儲存圖片');
    }
  }
});

/* ── Re-generate on option change if URL already entered ── */
[sizeSelect, colorPick, bgPick, ecSelect].forEach((el) => {
  el.addEventListener('change', () => {
    if (urlInput.value.trim() && !resultSection.classList.contains('hidden')) {
      generate();
    }
  });
});
