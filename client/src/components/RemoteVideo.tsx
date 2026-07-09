import { useEffect, useRef, useState } from "react";
import { Avatar } from "./shell/Avatar";
import { Icon } from "./shell/Icon";

interface RemoteVideoProps {
  stream: MediaStream;
  displayName: string;
  // Driven by the peer's "producer-paused" broadcast (see useMediasoup). The
  // paused producer stops carrying media, so without these the peer would see
  // silence / a frozen last frame with no indication the mute was intentional.
  audioMuted?: boolean;
  videoMuted?: boolean;
}

export function RemoteVideo({
  stream,
  displayName,
  audioMuted = false,
  videoMuted = false,
}: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(() => stream.getVideoTracks().length > 0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.play().catch(() => {});

    const update = () => setHasVideo(stream.getVideoTracks().some((t) => t.readyState === "live" && t.enabled));
    stream.addEventListener("addtrack", update);
    stream.addEventListener("removetrack", update);
    update();
    return () => {
      stream.removeEventListener("addtrack", update);
      stream.removeEventListener("removetrack", update);
    };
  }, [stream]);

  // A muted camera still delivers a (frozen) track, so fall back to the avatar
  // whenever the peer paused their video — not only when the track is gone.
  const showVideo = hasVideo && !videoMuted;

  return (
    <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/[0.06]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover scale-x-[-1] ${showVideo ? "" : "invisible"}`}
      />
      {!showVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
          <Avatar name={displayName} size={72} />
        </div>
      )}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[12px] font-medium text-white">
          {displayName}
        </span>
        {audioMuted && (
          <span
            className="w-6 h-6 rounded-md bg-red-500/90 backdrop-blur-sm inline-flex items-center justify-center text-white"
            title={`${displayName} is muted`}
          >
            <Icon name="micOff" size={13} />
          </span>
        )}
      </div>
    </div>
  );
}
