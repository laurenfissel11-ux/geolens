export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    // JOB 1: Listen for messages from the background script.
    browser.runtime.onMessage.addListener((message) => {
      console.log('[content] message received:', message);
      if (message.action === 'validate-image-start') {
        handleValidateStart(message.imageUrl);
      } else if (message.action === 'validate-image-result') {
        handleValidateResult(message.imageUrl, message.isValid, message.message);
      }
    });
  },
});

// ============================================================
// Helpers (live outside `main()` so they are easier to read)
// ============================================================

let styleInjected = false;
function injectSpinnerStyles() {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes geolens-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

function handleValidateStart(imageUrl: string) {
  console.log('[content] handleValidateStart called with URL:', imageUrl);
  const image = findImageByUrl(imageUrl);
  if (!image) return;

  const parent = image.parentElement;
  if (!parent) return;

  parent.style.position = 'relative';

  // Remove existing overlays
  const existing = parent.querySelectorAll('.geolens-ext-overlay');
  existing.forEach(e => e.remove());

  injectSpinnerStyles();

  const loading = document.createElement('div');
  loading.className = 'geolens-ext-overlay geolens-loading';
  loading.style.position = 'absolute';
  loading.style.top = '5px';
  loading.style.right = '5px';
  loading.style.width = '24px';
  loading.style.height = '24px';
  loading.style.background = 'rgba(255, 255, 255, 0.8)';
  loading.style.borderRadius = '50%';
  loading.style.border = '3px solid #ccc';
  loading.style.borderTopColor = '#333';
  loading.style.animation = 'geolens-spin 1s linear infinite';
  loading.style.zIndex = '9999';
  loading.style.pointerEvents = 'none';
  loading.style.boxSizing = 'border-box';
  
  parent.appendChild(loading);
}

function handleValidateResult(imageUrl: string, isValid: boolean, message?: string) {
  console.log('[content] handleValidateResult called with URL:', imageUrl);
  const image = findImageByUrl(imageUrl);
  console.log('[content] findImageByUrl returned:', image);
  if (!image) return;

  drawOverlay(image, isValid, message);
}

function findImageByUrl(url: string): HTMLImageElement | null {
  const allImages = document.querySelectorAll('img');
  for (const img of allImages) {
    if (img.currentSrc === url || img.src === url) return img;
  }
  return null;
}

function drawOverlay(image: HTMLImageElement, isValid: boolean, message?: string) {
  const parent = image.parentElement;
  if (!parent) return;

  // Ensure the parent can host an absolutely-positioned child.
  parent.style.position = 'relative';

  // Remove existing overlays (e.g. the loading spinner)
  const existing = parent.querySelectorAll('.geolens-ext-overlay');
  existing.forEach(e => e.remove());

  if (isValid && message) {
    const banner = document.createElement('div');
    banner.className = 'geolens-ext-overlay';
    banner.textContent = message;
    banner.style.position = 'absolute';
    banner.style.bottom = '5px';
    banner.style.left = '5px';
    banner.style.right = '5px';
    banner.style.background = 'rgba(0, 128, 0, 0.8)';
    banner.style.color = 'white';
    banner.style.padding = '8px';
    banner.style.fontSize = '14px';
    banner.style.borderRadius = '4px';
    banner.style.zIndex = '9999';
    banner.style.pointerEvents = 'none';
    banner.style.textAlign = 'center';
    
    // Also add a checkmark for good measure
    const overlay = document.createElement('div');
    overlay.className = 'geolens-ext-overlay';
    overlay.textContent = '✓';
    overlay.style.position = 'absolute';
    overlay.style.top = '5px';
    overlay.style.right = '5px';
    overlay.style.width = '24px';
    overlay.style.height = '24px';
    overlay.style.background = 'green';
    overlay.style.color = 'white';
    overlay.style.fontSize = '18px';
    overlay.style.fontWeight = 'bold';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.borderRadius = '50%';
    overlay.style.zIndex = '9999';
    overlay.style.pointerEvents = 'none';

    parent.appendChild(banner);
    parent.appendChild(overlay);
  } else {
    const overlay = document.createElement('div');
    overlay.className = 'geolens-ext-overlay';
    overlay.textContent = '✗';
    overlay.style.position = 'absolute';
    overlay.style.top = '5px';
    overlay.style.right = '5px';
    overlay.style.width = '24px';
    overlay.style.height = '24px';
    overlay.style.background = 'red';
    overlay.style.color = 'white';
    overlay.style.fontSize = '18px';
    overlay.style.fontWeight = 'bold';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.borderRadius = '50%';
    overlay.style.zIndex = '9999';
    overlay.style.pointerEvents = 'none';
    
    parent.appendChild(overlay);
  }
}
