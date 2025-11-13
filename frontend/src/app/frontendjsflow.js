// When user clicks play
const sessionId = generateUUID(); // Generate once per play session
let streamRecorded = false;
let startTime = Date.now();

audio.addEventListener('timeupdate', () => {
  const listenTime = (Date.now() - startTime) / 1000;
  
  // Record stream after 30 seconds (industry standard)
  if (listenTime >= 30 && !streamRecorded) {
    recordStream(trackId, sessionId, listenTime);
    streamRecorded = true;
  }
});

// Update listen time periodically (every 30 seconds)
setInterval(() => {
  if (audio.currentTime > 0) {
    updateListenTime(trackId, sessionId, audio.currentTime);
  }
}, 30000);

// Final update when user stops/pauses
audio.addEventListener('pause', () => {
  updateListenTime(trackId, sessionId, audio.currentTime);
});