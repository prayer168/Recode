/* QR Code Generator – app.js (qrcodejs) */

const urlInput      = document.getElementById('url-input');
const clearBtn      = document.getElementById('clear-btn');
const generateBtn   = document.getElementById('generate-btn');
const sizeSelect    = document.getElementById('size-select');
const colorPick     = document.getElementById('color-pick');
const bgPick        = document.getElementById('bg-pick');
const ecSelect      = document.getElementById('ec-select');
const resultSection = document.getElementById('result-section');
const qrContainer   = document.getElementById('qr-container');
const downloadPng   = document.getElementById('download-png');
const copyBtn       = document.getElementById('copy-btn');
const urlDisplay    = document.getElementById('url-display');
const errorMsg      = document.getElementById('error-msg');
const errorText     = document.getElementById('error-text');
const toast         = document.getElementById('toast');

let toastTimer = null;
const levelMap = {
  L: QRCode.CorrectLevel.L,
  M: QRCode.CorrectLevel.M,
  Q: QRCode.CorrectLevel.Q,
  H: QRCode.CorrectLevel.H,
};

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

function getCanvas() {
  return qrContainer.querySelector('canvas') || qrContainer.querySelector('img');
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

  const size = parseInt(sizeSelect.value, 10);

  // Clear previous QR code
  qrContainer.innerHTML = '';

  try {
    new QRCode(qrContainer, {
      text: url,
      width: size,
      height: size,
      colorDark: colorPick.value,
      colorLight: bgPick.value,
      correctLevel: levelMap[ecSelect.value],
    });
  } catch (err) {
    showError('生成失敗：' + (err.message || err));
    return;
  }

  urlDisplay.textContent = url;
  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

generateBtn.addEventListener('click', generate);

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') generate();
});

/* ── Download PNG ── */
downloadPng.addEventListener('click', () => {
  const el = getCanvas();
  if (!el) { showToast('請先生成 QR Code'); return; }

  const hostname = (() => {
    try { return new URL(urlInput.value.trim()).hostname.replace(/\./g, '_'); }
    catch { return 'qrcode'; }
  })();

  const link = document.createElement('a');
  link.download = `qr_${hostname}.png`;
  link.href = el.tagName === 'CANVAS'
    ? el.toDataURL('image/png')
    : el.src;
  link.click();
  showToast('已下載 PNG 圖片');
});

/* ── Copy to clipboard ── */
copyBtn.addEventListener('click', async () => {
  const canvas = qrContainer.querySelector('canvas');
  if (!canvas) { showToast('請先生成 QR Code'); return; }

  try {
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    showToast('已複製到剪貼簿');
  } catch {
    try {
      await navigator.clipboard.writeText(canvas.toDataURL('image/png'));
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
