import { useCallback, useRef } from "react";

export function useRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback((stream: MediaStream) => {
    if (recorderRef.current) return;

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    const audioStream = new MediaStream(audioTracks);
    const recorder = new MediaRecorder(audioStream, {
      mimeType: "audio/webm;codecs=opus",
    });

    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start(1000);
    recorderRef.current = recorder;
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(chunksRef.current.length > 0
          ? new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" })
          : null
        );
        recorderRef.current = null;
        return;
      }

      recorder.onstop = () => {
        const blob = chunksRef.current.length > 0
          ? new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" })
          : null;
        chunksRef.current = [];
        recorderRef.current = null;
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  return { startRecording, stopRecording };
}
