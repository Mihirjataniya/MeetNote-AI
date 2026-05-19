import { useEffect, useRef } from "react";
import { Avatar } from "./shell/Avatar";
import { Icon } from "./shell/Icon";

interface LocalVideoProps {
  stream: MediaStream;
  micOn: boolean;
  camOn: boolean;
  displayName: string;
}

export function LocalVideo({ stream, micOn, camOn, displayName }: LocalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/[0.06]">
      {/* Video — always in DOM, invisible when cam off */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover ${camOn ? "" : "invisible"}`}
      />

      {/* Camera-off avatar overlay */}
      {!camOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
          <Avatar name={displayName} size={72} />
        </div>
      )}

      {/* Bottom labels */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
        <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[12px] font-medium text-white">
          You
        </span>
        {!micOn && (
          <span className="w-7 h-7 rounded-full bg-[#dc2626]/80 backdrop-blur-sm inline-flex items-center justify-center">
            <Icon name="micOff" size={13} className="text-white" />
          </span>
        )}
      </div>
    </div>
  );
}
