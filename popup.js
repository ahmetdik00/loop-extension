function showSnackbar(message) {
  const snackbar = document.getElementById('snackbar');
  snackbar.textContent = message;
  snackbar.className = "show";
  setTimeout(() => { snackbar.className = snackbar.className.replace("show", ""); }, 3000);
}

function logError(message) {
  console.error(`[${new Date().toISOString()}] [Popup] Error: ${message}`);
}

function loadSettings() {
  chrome.storage.sync.get(["loopStart", "loopEnd", "loopActive"], (data) => {
    if (data.loopStart !== undefined) {
      document.getElementById('start').value = data.loopStart;
      document.getElementById('startSlider').value = data.loopStart;
    }
    if (data.loopEnd !== undefined) {
      document.getElementById('end').value = data.loopEnd;
      document.getElementById('endSlider').value = data.loopEnd;
    }
    if (data.loopActive) {
      showSnackbar("Döngü aktif");
    }
  });
}

document.getElementById('start').addEventListener('input', (e) => {
  document.getElementById('startSlider').value = e.target.value;
});
document.getElementById('startSlider').addEventListener('input', (e) => {
  document.getElementById('start').value = e.target.value;
});
document.getElementById('end').addEventListener('input', (e) => {
  document.getElementById('endSlider').value = e.target.value;
});
document.getElementById('endSlider').addEventListener('input', (e) => {
  document.getElementById('end').value = e.target.value;
});

document.getElementById('apply').addEventListener('click', () => {
  const loopStart = parseFloat(document.getElementById('start').value);
  const loopEnd = parseFloat(document.getElementById('end').value);
  
  if (isNaN(loopStart) || isNaN(loopEnd)) {
    showSnackbar("Lütfen geçerli sayılar girin.");
    logError("Geçersiz sayı girişi.");
    return;
  }
  if (loopEnd <= loopStart) {
    showSnackbar("Bitiş, başlangıçtan büyük olmalı.");
    logError("Bitiş değeri, başlangıçtan küçük veya eşit.");
    return;
  }
  
  chrome.storage.sync.set({ loopStart, loopEnd, loopActive: true }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "enableLoop", loopStart, loopEnd }, (response) => {
          if (response && response.status && response.status.startsWith("loop enabled")) {
            showSnackbar(`Döngü aktif: ${loopStart}s - ${loopEnd}s`);
          } else {
            showSnackbar("Mesaj gönderilemedi.");
            logError("enableLoop mesajı gönderilemedi.");
          }
        });
      } else {
        showSnackbar("Aktif sekme bulunamadı.");
        logError("Aktif sekme bulunamadı.");
      }
    });
  });
});

document.getElementById('preview').addEventListener('click', () => {
  const loopStart = parseFloat(document.getElementById('start').value);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "preview", loopStart, duration: 5 }, (response) => {
        if (response && response.status === "preview started") {
          showSnackbar("Önizleme başladı");
        } else {
          showSnackbar("Önizleme başlatılamadı");
          logError("Önizleme mesajı gönderilemedi.");
        }
      });
    } else {
      showSnackbar("Aktif sekme bulunamadı.");
      logError("Aktif sekme bulunamadı.");
    }
  });
});

document.getElementById('disable').addEventListener('click', () => {
  chrome.storage.sync.set({ loopActive: false }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "disableLoop" }, (response) => {
          if (response && response.status === "loop disabled") {
            showSnackbar("Döngü devre dışı bırakıldı");
          } else {
            showSnackbar("Mesaj gönderilemedi.");
            logError("disableLoop mesajı gönderilemedi.");
          }
        });
      } else {
        showSnackbar("Aktif sekme bulunamadı.");
        logError("Aktif sekme bulunamadı.");
      }
    });
  });
});

document.addEventListener('DOMContentLoaded', loadSettings);
