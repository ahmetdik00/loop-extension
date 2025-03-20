// Toast bildirimi
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.opacity = 1;
  setTimeout(() => { toast.style.opacity = 0; }, 2000);
}

function logError(message) {
  console.error(`[${new Date().toISOString()}] [Popup] Error: ${message}`);
}

// Ayarları yükle
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
      showToast("Döngü aktif");
    }
  });
}

// Sayı girişi ve slider senkronizasyonu
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

// Döngüyü aktif etme
document.getElementById('apply').addEventListener('click', () => {
  const loopStart = parseFloat(document.getElementById('start').value);
  const loopEnd = parseFloat(document.getElementById('end').value);
  
  if (isNaN(loopStart) || isNaN(loopEnd)) {
    showToast("Lütfen geçerli sayılar girin.");
    logError("Geçersiz sayı girişi.");
    return;
  }
  if (loopEnd <= loopStart) {
    showToast("Bitiş, başlangıçtan büyük olmalı.");
    logError("Bitiş değeri, başlangıçtan küçük veya eşit.");
    return;
  }
  
  chrome.storage.sync.set({ loopStart, loopEnd, loopActive: true }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "enableLoop", loopStart, loopEnd }, (response) => {
          if (response && response.status && response.status.startsWith("loop enabled")) {
            showToast(`Döngü aktif: ${loopStart}s - ${loopEnd}s`);
          } else {
            showToast("Mesaj gönderilemedi.");
            logError("enableLoop mesajı gönderilemedi.");
          }
        });
      } else {
        showToast("Aktif sekme bulunamadı.");
        logError("Aktif sekme bulunamadı.");
      }
    });
  });
});

// Önizleme butonu: 5 saniyelik önizleme gönderir.
document.getElementById('preview').addEventListener('click', () => {
  const loopStart = parseFloat(document.getElementById('start').value);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "preview", loopStart, duration: 5 }, (response) => {
        if (response && response.status === "preview started") {
          showToast("Önizleme başladı");
        } else {
          showToast("Önizleme başlatılamadı");
          logError("Önizleme mesajı gönderilemedi.");
        }
      });
    } else {
      showToast("Aktif sekme bulunamadı.");
      logError("Aktif sekme bulunamadı.");
    }
  });
});

// Döngüyü kapatma
document.getElementById('disable').addEventListener('click', () => {
  chrome.storage.sync.set({ loopActive: false }, () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "disableLoop" }, (response) => {
          if (response && response.status === "loop disabled") {
            showToast("Döngü devre dışı bırakıldı");
          } else {
            showToast("Mesaj gönderilemedi.");
            logError("disableLoop mesajı gönderilemedi.");
          }
        });
      } else {
        showToast("Aktif sekme bulunamadı.");
        logError("Aktif sekme bulunamadı.");
      }
    });
  });
});

document.addEventListener('DOMContentLoaded', loadSettings);
