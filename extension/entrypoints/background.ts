export default defineBackground(() => {
  // JOB 1: Register the context menu item (runs once when the extension loads).
  browser.contextMenus.create({
    id: 'validate-image',
    title: 'Validate image',
    contexts: ['image'],
  });

  // JOB 2: Listen for clicks on any of the context menu items.
  browser.contextMenus.onClicked.addListener((info, tab) => {
    console.log('[background] menu click received:', info, tab);
    
    // Only react to the Validate image menu item.
    if (info.menuItemId !== 'validate-image') return;

    // Defensively ensure there is a tab to send to.
    if (!tab?.id) return;

    // Send a message to the content script in that tab.
    browser.tabs.sendMessage(tab.id, {
      action: 'validate-image',
      imageUrl: info.srcUrl,
    });
  });
});
