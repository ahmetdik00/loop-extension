// content.js - Geliştirilmiş Versiyon
let loopActive = false;
let loopStart = 60;
let loopEnd = 130;
let player = null;
let observer = null;
let previewTimeout = null;

function logError(message) {
  console.error(`[${new Date().toISOString()}] [Content] Error: ${message}`);
}

function showPageToast(message) {
  let toast = document.getElementById('ytm-loop-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ytm-loop-toast';
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#1db954',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '4px',
      fontSize: '0.9rem',
      zIndex: 9999,
      opacity: 0,
      transition: 'opacity 0.5s'
    });
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = 1;
  setTimeout(() => { toast.style.opacity = 0; }, 2000);
}

function findPlayer() {
  // YouTube Music oynatıcısını (video veya audio) bulmaya yönelik daha sağlam seçim
  const media = document.querySelector('video, audio');
  if (!media) {
    logError("Oynatıcı elementi bulunamadı.");
  }
  return media;
}

function attachLoopHandler() {
  if (!player) return;
  player.removeEventListener('timeupdate', loopHandler);
  player.addEventListener('timeupdate', loopHandler);
}

function detachLoopHandler() {
  if (player) {
    player.removeEventListener('timeupdate', loopHandler);
  }
}

function loopHandler() {
  if (loopActive && player.currentTime >= loopEnd) {
    player.currentTime = loopStart;
    setTimeout(() => player.play(), 50);
  }
}

function disconnectObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

function setupObserver() {
  disconnectObserver(); // Önceki observer varsa kapatıyoruz
  observer = new MutationObserver(() => {
    const newPlayer = findPlayer();
    if (newPlayer && newPlayer !== player) {
      player = newPlayer;
      if (loopActive) {
        attachLoopHandler();
        showPageToast(`Loop: ${loopStart}-${loopEnd}s (Player reattached)`);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function initializePlayer() {
  player = findPlayer();
  if (player && loopActive) {
    attachLoopHandler();
  }
  // Oynatıcıdaki dinamik değişiklikleri yakalamak için observer’ı başlatıyoruz.
  setupObserver();
}

document.addEventListener('DOMContentLoaded', () => {
  initializePlayer();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "enableLoop") {
    loopActive = true;
    loopStart = msg.loopStart;
    loopEnd = msg.loopEnd;
    player = findPlayer();
    if (player) {
      attachLoopHandler();
      showPageToast(`Loop: ${loopStart}-${loopEnd}s`);
      sendResponse({ status: `loop enabled: ${loopStart}-${loopEnd}` });
    } else {
      setupObserver();
      sendResponse({ status: `loop enabled, player pending: ${loopStart}-${loopEnd}` });
    }
  } else if (msg.action === "disableLoop") {
    loopActive = false;
    detachLoopHandler();
    showPageToast("Loop devre dışı");
    sendResponse({ status: "loop disabled" });
  } else if (msg.action === "preview") {
    const previewDuration = msg.duration || 5;
    player = findPlayer();
    if (player) {
      const currentTime = player.currentTime;
      player.currentTime = msg.loopStart;
      player.play();
      showPageToast("Önizleme başladı");
      clearTimeout(previewTimeout);
      previewTimeout = setTimeout(() => {
        player.currentTime = currentTime;
        player.play();
        showPageToast("Önizleme bitti");
      }, previewDuration * 1000);
      sendResponse({ status: "preview started" });
    } else {
      logError("Player not found during preview.");
      sendResponse({ status: "player not found" });
    }
  }
});

chrome.storage.sync.get(["loopActive", "loopStart", "loopEnd"], (data) => {
  if (data.loopActive) {
    loopActive = true;
    loopStart = data.loopStart || loopStart;
    loopEnd = data.loopEnd || loopEnd;
    player = findPlayer();
    if (player) {
      attachLoopHandler();
      showPageToast(`Loop aktifleştirildi: ${loopStart}-${loopEnd}s`);
    } else {
      setupObserver();
    }
  }
});
