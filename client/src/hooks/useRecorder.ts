import { useCallback, useRef } from "react";

export interface ChunkResult {
  blob: Blob;
  chunkIndex: number;
  chunkStartMs: number;
}

export function useRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const chunkIndexRef = useRef(0);
  const recordingStartRef = useRef(0);
  const chunkStartTimeRef = useRef(0);

  const startRecording = useCallback((stream: MediaStream) => {
    if (recorderRef.current) return;

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    const audioStream = new MediaStream(audioTracks);
    streamRef.current = audioStream;

    const recorder = new MediaRecorder(audioStream, {
      mimeType: "audio/webm;codecs=opus",
    });

    chunksRef.current = [];
    chunkIndexRef.current = 0;
    recordingStartRef.current = Date.now();
    chunkStartTimeRef.current = 0;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start(1000);
    recorderRef.current = recorder;
  }, []);

  const flushChunk = useCallback((): Promise<ChunkResult | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      const stream = streamRef.current;

      if (!recorder || recorder.state === "inactive" || !stream) {
        resolve(null);
        return;
      }

      if (chunksRef.current.length === 0) {
        resolve(null);
        return;
      }

      const chunkIndex = chunkIndexRef.current;
      const chunkStartMs = chunkStartTimeRef.current;

      recorder.onstop = () => {
        const blob =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" })
            : null;

        chunksRef.current = [];
        chunkIndexRef.current++;
        chunkStartTimeRef.current = Date.now() - recordingStartRef.current;

        const newRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });
        newRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        newRecorder.start(1000);
        recorderRef.current = newRecorder;

        resolve(blob ? { blob, chunkIndex, chunkStartMs } : null);
      };

      recorder.stop();
    });
  }, []);

  const stopRecording = useCallback((): Promise<ChunkResult | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      const chunkIndex = chunkIndexRef.current;
      const chunkStartMs = chunkStartTimeRef.current;

      if (!recorder || recorder.state === "inactive") {
        const blob =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" })
            : null;
        chunksRef.current = [];
        recorderRef.current = null;
        streamRef.current = null;
        resolve(blob ? { blob, chunkIndex, chunkStartMs } : null);
        return;
      }

      recorder.onstop = () => {
        const blob =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" })
            : null;
        chunksRef.current = [];
        recorderRef.current = null;
        streamRef.current = null;
        resolve(blob ? { blob, chunkIndex, chunkStartMs } : null);
      };

      recorder.stop();
    });
  }, []);

  return { startRecording, stopRecording, flushChunk };
}
