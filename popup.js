// popup.js - Modern Popup İşlevselliği (Tema Toggle Dahil)

function showSnackbar(message) {
  const snackbar = document.getElementById('snackbar');
  snackbar.textContent = message;
  snackbar.className = "show";
  setTimeout(() => {
    snackbar.className = snackbar.className.replace("show", "");
  }, 3000);
}

function logError(message) {
  console.error(`[${new Date().toISOString()}] [Popup] ${message}`);
}

function loadSettings() {
  chrome.storage.sync.get(["loopStart", "loopEnd", "loopActive", "theme"], (data) => {
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
    // Tema ayarını uygula
    if (data.theme === 'light') {
      document.body.classList.add('light');
      document.getElementById('themeToggle').textContent = '☼';
    } else {
      document.body.classList.remove('light');
      document.getElementById('themeToggle').textContent = '☾';
    }
    updateSliderLimits();
  });
}

function updateSliderLimits() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getDuration" }, (response) => {
        if (response && response.duration) {
          const duration = Math.floor(response.duration);
          document.getElementById('startSlider').max = duration;
          document.getElementById('endSlider').max = duration;
          if (parseFloat(document.getElementById('start').value) > duration) {
            document.getElementById('start').value = 0;
            document.getElementById('startSlider').value = 0;
          }
          if (parseFloat(document.getElementById('end').value) > duration) {
            document.getElementById('end').value = duration;
            document.getElementById('endSlider').value = duration;
          }
        }
      });
    }
  });
}

// Input senkronizasyonu
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

// Buton işlemleri
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

// Tema toggle işlemi
document.getElementById('themeToggle').addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light');
  chrome.storage.sync.set({ theme: isLight ? 'light' : 'dark' });
  document.getElementById('themeToggle').textContent = isLight ? '☼' : '☾';
});

document.addEventListener('DOMContentLoaded', loadSettings);
