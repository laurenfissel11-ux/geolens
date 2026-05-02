export default defineContentScript({
  matches: ['<all_urls>'],

  main() {
    // JOB 1: Listen for messages from the background script.
    browser.runtime.onMessage.addListener((message) => {
      console.log('[content] message received:', message);
      if (message.action === 'validate-image') {
        handleValidate(message.imageUrl);
      }
    });
  },
});

// ============================================================
// Helpers (live outside `main()` so they are easier to read)
// ============================================================

async function handleValidate(imageUrl: string) {
  console.log('[content] handleValidate called with URL:', imageUrl);
  const image = findImageByUrl(imageUrl);
  console.log('[content] findImageByUrl returned:', image);
  if (!image) return;

  const isValid = await stubValidate(imageUrl);
  console.log('[content] stubValidate returned:', isValid);
  if (isValid) {
    drawCheckmarkOverlay(image);
  }
}

function findImageByUrl(url: string): HTMLImageElement | null {
  const allImages = document.querySelectorAll('img');
  for (const img of allImages) {
    if (img.currentSrc === url || img.src === url) return img;
  }
  return null;
}

async function stubValidate(imageUrl: string): Promise<boolean> {
  // Pretend to do work for 500ms, then always return true.
  await new Promise((resolve) => setTimeout(resolve, 500));
  return true;
}

function drawCheckmarkOverlay(image: HTMLImageElement) {
  const parent = image.parentElement;
  if (!parent) return;

  // Ensure the parent can host an absolutely-positioned child.
  // (If it already had a position other than 'static', that would be respected;
  //  Force 'relative' for the MVP.)
  parent.style.position = 'relative';

  const overlay = document.createElement('div');
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
  overlay.style.pointerEvents = 'none'; // Don't block clicks on the image

  parent.appendChild(overlay);
}
