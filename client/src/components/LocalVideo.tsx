import { useEffect, useRef } from "react";

export function LocalVideo({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-container video-local">
      <video ref={videoRef} autoPlay muted playsInline />
      <span className="video-label">You</span>
    </div>
  );
}
