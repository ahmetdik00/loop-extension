function logError(message) {
    console.error(`[${new Date().toISOString()}] [Background] Error: ${message}`);
  }
  
  chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        logError("Aktif sekme bulunamadı. Komut: " + command);
        return;
      }
      const activeTabId = tabs[0].id;
      if (command === "toggle-loop") {
        chrome.storage.sync.get(["loopActive", "loopStart", "loopEnd"], (data) => {
          if (data.loopActive) {
            // Döngüyü kapat
            chrome.tabs.sendMessage(activeTabId, { action: "disableLoop" }, (response) => {
              if (chrome.runtime.lastError) {
                logError(chrome.runtime.lastError.message);
              } else {
                console.log(`[${new Date().toISOString()}] [Background] Döngü kapatıldı.`);
              }
            });
            chrome.storage.sync.set({ loopActive: false });
          } else {
            let loopStart = data.loopStart !== undefined ? data.loopStart : 60;
            let loopEnd = data.loopEnd !== undefined ? data.loopEnd : 130;
            if (loopEnd <= loopStart) {
              logError("Geçersiz ayar: loopEnd <= loopStart");
              return;
            }
            chrome.tabs.sendMessage(activeTabId, { action: "enableLoop", loopStart, loopEnd }, (response) => {
              if (chrome.runtime.lastError) {
                logError(chrome.runtime.lastError.message);
              } else {
                console.log(`[${new Date().toISOString()}] [Background] Döngü açıldı: ${loopStart}-${loopEnd}`);
              }
            });
            chrome.storage.sync.set({ loopActive: true, loopStart, loopEnd });
          }
        });
      } else if (command === "preview-loop") {
        chrome.storage.sync.get(["loopStart"], (data) => {
          let loopStart = data.loopStart !== undefined ? data.loopStart : 60;
          let duration = 5; // Önizleme süresi (saniye)
          chrome.tabs.sendMessage(activeTabId, { action: "preview", loopStart, duration }, (response) => {
            if (chrome.runtime.lastError) {
              logError(chrome.runtime.lastError.message);
            } else {
              console.log(`[${new Date().toISOString()}] [Background] Önizleme başlatıldı.`);
            }
          });
        });
      }
    });
  });
  