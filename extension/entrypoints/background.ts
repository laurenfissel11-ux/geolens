export default defineBackground(() => {
  // JOB 1: Register the context menu item (runs once when the extension loads).
  browser.contextMenus.create({
    id: 'validate-image',
    title: 'Validate image',
    contexts: ['image'],
  });

  // JOB 2: Listen for clicks on any of the context menu items.
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log('[background] menu click received:', info, tab);
    
    // Only react to the Validate image menu item.
    if (info.menuItemId !== 'validate-image') return;

    // Defensively ensure there is a tab to send to.
    if (!tab?.id) return;

    // Send a message to start loading
    browser.tabs.sendMessage(tab.id, {
      action: 'validate-image-start',
      imageUrl: info.srcUrl,
    });

    try {
      if (!info.srcUrl) throw new Error('No srcUrl found');
      
      const imgRes = await fetch(info.srcUrl);
      const blob = await imgRes.blob();
      
      const formData = new FormData();
      formData.append('file', blob, 'image.png');

      const apiRes = await fetch('http://localhost:8000/verify-image/', {
        method: 'POST',
        body: formData,
      });

      let isValid = false;
      let message = '';

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.status === 'verified') {
          isValid = true;
          message = data.decoded_message;
        }
      }

      // Send a message to the content script in that tab.
      browser.tabs.sendMessage(tab.id, {
        action: 'validate-image-result',
        imageUrl: info.srcUrl,
        isValid,
        message,
      });
    } catch (err) {
      console.error('[background] error validating image:', err);
      browser.tabs.sendMessage(tab.id, {
        action: 'validate-image-result',
        imageUrl: info.srcUrl,
        isValid: false,
      });
    }
  });
});
