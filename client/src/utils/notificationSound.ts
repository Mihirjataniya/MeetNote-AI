const JOIN_REQUEST_SOUND_URL =
  "https://res.cloudinary.com/dgm9tbtvf/video/upload/v1780761161/meetnote/assets/notification-ding.mp3";

let cachedAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!cachedAudio) {
    cachedAudio = new Audio(JOIN_REQUEST_SOUND_URL);
    cachedAudio.preload = "auto";
    cachedAudio.volume = 0.6;
  }
  return cachedAudio;
}

export function playJoinRequestSound(): void {
  const audio = getAudio();
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {
      // ignored — browser autoplay restriction or no user gesture yet
    });
  } catch {
    // ignored — audio failure is not critical
  }
}
