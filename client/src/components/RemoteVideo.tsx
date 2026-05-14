import { useEffect, useRef } from "react";

interface RemoteVideoProps {
  stream: MediaStream;
  displayName: string;
}

export function RemoteVideo({ stream, displayName }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-container video-remote">
      <video ref={videoRef} autoPlay playsInline />
      <span className="video-label">{displayName}</span>
    </div>
  );
}
