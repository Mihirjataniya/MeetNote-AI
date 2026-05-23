import { useEffect, useRef, useState } from "react";
import { Avatar } from "./shell/Avatar";

interface RemoteVideoProps {
  stream: MediaStream;
  displayName: string;
}

export function RemoteVideo({ stream, displayName }: RemoteVideoProps) {
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

  return (
    <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/[0.06]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover scale-x-[-1] ${hasVideo ? "" : "invisible"}`}
      />
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
          <Avatar name={displayName} size={72} />
        </div>
      )}
      <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[12px] font-medium text-white">
          {displayName}
        </span>
      </div>
    </div>
  );
}
