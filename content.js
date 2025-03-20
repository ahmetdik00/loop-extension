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
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = '#1db954';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '4px';
    toast.style.fontSize = '0.9rem';
    toast.style.zIndex = 9999;
    toast.style.opacity = 0;
    toast.style.transition = 'opacity 0.5s';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = 1;
  setTimeout(() => { toast.style.opacity = 0; }, 2000);
}

function findPlayer() {
  // Hem video hem audio elementini deniyoruz.
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

function loopHandler() {
  if (loopActive && player.currentTime >= loopEnd) {
    player.currentTime = loopStart;
    setTimeout(() => player.play(), 50);
  }
}

function setupObserver() {
  if (observer) observer.disconnect();
  observer = new MutationObserver(() => {
    player = findPlayer();
    if (player && loopActive) {
      attachLoopHandler();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function periodicPlayerCheck() {
  if (!player) {
    player = findPlayer();
    if (player && loopActive) {
      attachLoopHandler();
    }
  }
}
setInterval(periodicPlayerCheck, 3000);

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
    if (player) {
      player.removeEventListener('timeupdate', loopHandler);
    }
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
