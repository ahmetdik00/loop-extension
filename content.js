// content.js - Gelişmiş Bildirim Ayarları (Snackbar Süresi ve Konum) ile Shadow DOM Desteği
let loopActive = false;
let loopStart = 60;
let loopEnd = 130;
let player = null;
let observer = null;
let previewTimeout = null;
let loopOverlay = null;

function logError(message) {
  console.error(`[${new Date().toISOString()}] [Content] Error: ${message}`);
}

// Gelişmiş showPageToast: Snackbar konumu ve süresi storage'dan okunuyor.
function showPageToast(message) {
  let toast = document.getElementById('ytm-loop-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ytm-loop-toast';
    // Varsayılan stil ayarları; konum ve transform ayarı storage'dan sonra güncellenecek.
    Object.assign(toast.style, {
      position: 'fixed',
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
  
  // Storage'dan bildirim ayarlarını oku
  chrome.storage.sync.get(["snackbarDuration", "snackbarPosition"], (data) => {
    const duration = data.snackbarDuration || 3000;
    const position = data.snackbarPosition || 'bottom';
    
    // Konum ayarına göre stil güncellemesi
    if (position === 'top') {
      toast.style.top = '30px';
      toast.style.bottom = '';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
    } else if (position === 'center') {
      toast.style.top = '50%';
      toast.style.bottom = '';
      toast.style.left = '50%';
      toast.style.transform = 'translate(-50%, -50%)';
    } else { // varsayılan: bottom
      toast.style.bottom = '20px';
      toast.style.top = '';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
    }
    
    toast.textContent = message;
    toast.style.opacity = 1;
    setTimeout(() => { toast.style.opacity = 0; }, duration);
  });
}

function findPlayer() {
  // İlk olarak basit querySelector ile deniyoruz.
  let media = document.querySelector('video, audio');
  if (media) return media;
  
  // Eğer bulunamadıysa, YouTube Music uygulamasının Shadow DOM'una bakıyoruz.
  const ytmusicApp = document.querySelector('ytmusic-app');
  if (ytmusicApp && ytmusicApp.shadowRoot) {
    media = ytmusicApp.shadowRoot.querySelector('video, audio');
    if (media) return media;
    
    // Bazı durumlarda, daha derin bir katman olabilir.
    const innerApp = ytmusicApp.shadowRoot.querySelector('ytmusic-player-bar');
    if (innerApp && innerApp.shadowRoot) {
      media = innerApp.shadowRoot.querySelector('video, audio');
      if (media) return media;
    }
  }
  
  logError("Oynatıcı elementi bulunamadı.");
  return null;
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
  disconnectObserver();
  observer = new MutationObserver(() => {
    const newPlayer = findPlayer();
    if (newPlayer && newPlayer !== player) {
      player = newPlayer;
      if (loopActive) {
        attachLoopHandler();
        showPageToast(`Loop: ${loopStart}-${loopEnd}s (Player reattached)`);
        updateLoopOverlay();
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
  setupObserver();
}

function createOrUpdateLoopOverlay() {
  if (!loopOverlay) {
    loopOverlay = document.createElement('div');
    loopOverlay.id = 'loop-overlay';
    Object.assign(loopOverlay.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '0.9rem',
      zIndex: 10000
    });
    document.body.appendChild(loopOverlay);
  }
  let durationText = (player && player.duration && isFinite(player.duration))
    ? ` / ${Math.floor(player.duration)}s` : '';
  loopOverlay.textContent = `Loop: ${loopStart}s - ${loopEnd}s${durationText}`;
}

function updateLoopOverlay() {
  if (loopActive) {
    createOrUpdateLoopOverlay();
  } else if (loopOverlay) {
    loopOverlay.remove();
    loopOverlay = null;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "enableLoop") {
    loopActive = true;
    loopStart = msg.loopStart;
    loopEnd = msg.loopEnd;
    player = findPlayer();
    if (player) {
      attachLoopHandler();
      showPageToast(`Loop: ${loopStart}-${loopEnd}s`);
      updateLoopOverlay();
      sendResponse({ status: `loop enabled: ${loopStart}-${loopEnd}` });
    } else {
      setupObserver();
      sendResponse({ status: `loop enabled, player pending: ${loopStart}-${loopEnd}` });
    }
  } else if (msg.action === "disableLoop") {
    loopActive = false;
    detachLoopHandler();
    showPageToast("Loop devre dışı");
    updateLoopOverlay();
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
  } else if (msg.action === "getDuration") {
    player = findPlayer();
    if (player) {
      if (!player.duration || !isFinite(player.duration)) {
        let responded = false;
        player.addEventListener('loadedmetadata', function metadataHandler() {
          player.removeEventListener('loadedmetadata', metadataHandler);
          if (!responded) {
            responded = true;
            sendResponse({ duration: player.duration });
          }
        });
        const checkDuration = setInterval(() => {
          if (player.duration && isFinite(player.duration)) {
            clearInterval(checkDuration);
            if (!responded) {
              responded = true;
              sendResponse({ duration: player.duration });
            }
          }
        }, 500);
        return true;
      } else {
        sendResponse({ duration: player.duration });
      }
    } else {
      sendResponse({ duration: null });
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
      updateLoopOverlay();
    } else {
      setupObserver();
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initializePlayer();
});
