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
    <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/[0.06]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[12px] font-medium text-white">
          {displayName}
        </span>
      </div>
    </div>
  );
}
