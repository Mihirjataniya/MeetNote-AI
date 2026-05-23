import { useCallback, useEffect, useRef, useState } from "react";
import { Device } from "mediasoup-client";
import type { Transport, Producer, Consumer } from "mediasoup-client/types";
import type { TypedSocket } from "./useSocket";
import { isError } from "../types/index";
import type {
  TransportCreatedResponse,
  RtpCapabilitiesResponse,
  ProducedResponse,
  ConsumedResponse,
  NewProducerPayload,
  ProducerClosedPayload,
  PeerLeftPayload,
  ExistingProducersResponse,
} from "../types/index";

interface PendingProducer {
  producerId: string;
  producerSocketId: string;
  appData?: Record<string, unknown>;
}

export function useMediasoup(socket: TypedSocket | null, roomId: string | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [remoteScreenStreams, setRemoteScreenStreams] = useState<Map<string, MediaStream>>(new Map());
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const producersRef = useRef<Map<string, Producer>>(new Map());
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const remoteScreenStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const screenProducerRef = useRef<Producer | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const producerSourceRef = useRef<Map<string, "camera" | "screen">>(new Map());
  const roomIdRef = useRef<string | null>(null);
  const socketRef = useRef<TypedSocket | null>(null);
  const receivingInitRef = useRef(false);
  const consumedProducerIds = useRef<Set<string>>(new Set());
  const pendingProducersRef = useRef<PendingProducer[]>([]);

  // Promise locks — prevent concurrent callers from creating duplicate resources
  const deviceInitPromise = useRef<Promise<Device> | null>(null);
  const sendTransportInitPromise = useRef<Promise<Transport> | null>(null);
  const recvTransportInitPromise = useRef<Promise<Transport> | null>(null);

  // Keep refs in sync during render so callbacks always read the latest value
  // without needing to be listed as effect dependencies.
  roomIdRef.current = roomId;
  socketRef.current = socket;

  const updateRemoteStreams = useCallback(() => {
    setRemoteStreams(new Map(remoteStreamsRef.current));
  }, []);

  const updateRemoteScreenStreams = useCallback(() => {
    setRemoteScreenStreams(new Map(remoteScreenStreamsRef.current));
  }, []);

  const emitWithAck = useCallback(
    <TResponse,>(
      event: string,
      payload: Record<string, unknown>
    ): Promise<TResponse> => {
      return new Promise((resolve, reject) => {
        const s = socketRef.current;
        if (!s) {
          reject(new Error("Socket not connected"));
          return;
        }
        (s as unknown as { emit: (event: string, payload: unknown, cb: (res: unknown) => void) => void })
          .emit(event, payload, (response: unknown) => {
            if (isError(response)) {
              reject(new Error(response.message));
            } else {
              resolve(response as TResponse);
            }
          });
      });
    },
    []
  );

  const ensureDevice = useCallback(async (): Promise<Device> => {
    if (deviceRef.current) return deviceRef.current;
    if (deviceInitPromise.current) return deviceInitPromise.current;

    const currentRoomId = roomIdRef.current;
    if (!currentRoomId) throw new Error("No room ID");

    deviceInitPromise.current = (async () => {
      const { rtpCapabilities } = await emitWithAck<RtpCapabilitiesResponse>(
        "get-rtp-capabilities",
        { roomId: currentRoomId }
      );
      const device = new Device();
      await device.load({ routerRtpCapabilities: rtpCapabilities });
      deviceRef.current = device;
      return device;
    })().catch((err) => {
      deviceInitPromise.current = null;
      throw err;
    });

    return deviceInitPromise.current;
  }, [emitWithAck]);

  const createSendTransport = useCallback(
    async (device: Device): Promise<Transport> => {
      if (sendTransportRef.current) return sendTransportRef.current;
      if (sendTransportInitPromise.current) return sendTransportInitPromise.current;

      const currentRoomId = roomIdRef.current;
      if (!currentRoomId) throw new Error("No room ID");

      sendTransportInitPromise.current = (async () => {
        const params = await emitWithAck<TransportCreatedResponse>(
          "create-transport",
          { roomId: currentRoomId, direction: "send" }
        );

        const transport = device.createSendTransport({
          id: params.id,
          iceParameters: params.iceParameters,
          iceCandidates: params.iceCandidates,
          dtlsParameters: params.dtlsParameters,
        });

        transport.on("connect", ({ dtlsParameters }, callback, errback) => {
          emitWithAck<{ connected: true }>("connect-transport", {
            roomId: roomIdRef.current!,
            transportId: transport.id,
            dtlsParameters,
          })
            .then(() => callback())
            .catch(errback);
        });

        transport.on("produce", ({ kind, rtpParameters, appData }, callback, errback) => {
          emitWithAck<ProducedResponse>("produce", {
            roomId: roomIdRef.current!,
            transportId: transport.id,
            kind,
            rtpParameters,
            appData,
          })
            .then(({ producerId }) => callback({ id: producerId }))
            .catch(errback);
        });

        sendTransportRef.current = transport;
        return transport;
      })().catch((err) => {
        sendTransportInitPromise.current = null;
        throw err;
      });

      return sendTransportInitPromise.current;
    },
    [emitWithAck]
  );

  const createRecvTransport = useCallback(
    async (device: Device): Promise<Transport> => {
      if (recvTransportRef.current) return recvTransportRef.current;
      if (recvTransportInitPromise.current) return recvTransportInitPromise.current;

      const currentRoomId = roomIdRef.current;
      if (!currentRoomId) throw new Error("No room ID");

      recvTransportInitPromise.current = (async () => {
        const params = await emitWithAck<TransportCreatedResponse>(
          "create-transport",
          { roomId: currentRoomId, direction: "recv" }
        );

        const transport = device.createRecvTransport({
          id: params.id,
          iceParameters: params.iceParameters,
          iceCandidates: params.iceCandidates,
          dtlsParameters: params.dtlsParameters,
        });

        transport.on("connect", ({ dtlsParameters }, callback, errback) => {
          emitWithAck<{ connected: true }>("connect-transport", {
            roomId: roomIdRef.current!,
            transportId: transport.id,
            dtlsParameters,
          })
            .then(() => callback())
            .catch(errback);
        });

        recvTransportRef.current = transport;
        return transport;
      })().catch((err) => {
        recvTransportInitPromise.current = null;
        throw err;
      });

      return recvTransportInitPromise.current;
    },
    [emitWithAck]
  );

  const consumeProducer = useCallback(
    async (producerId: string, producerSocketId: string, appData?: Record<string, unknown>) => {
      if (consumedProducerIds.current.has(producerId)) return;

      const currentRoomId = roomIdRef.current;
      const device = deviceRef.current;
      const recvTransport = recvTransportRef.current;

      if (!currentRoomId || !device || !recvTransport) {
        console.warn("[mediasoup] consumeProducer deferred — not ready yet", {
          producerId: producerId.slice(0, 8),
          hasDevice: !!device,
          hasRecvTransport: !!recvTransport,
        });
        pendingProducersRef.current.push({ producerId, producerSocketId, appData });
        return;
      }

      consumedProducerIds.current.add(producerId);

      const isScreen = appData?.source === "screen";
      const streamsRef = isScreen ? remoteScreenStreamsRef : remoteStreamsRef;
      const updateFn = isScreen ? updateRemoteScreenStreams : updateRemoteStreams;

      try {
        const response = await emitWithAck<ConsumedResponse>("consume", {
          roomId: currentRoomId,
          producerId,
          rtpCapabilities: device.rtpCapabilities,
        });

        const consumer = await recvTransport.consume({
          id: response.consumerId,
          producerId: response.producerId,
          kind: response.kind,
          rtpParameters: response.rtpParameters,
        });

        consumersRef.current.set(consumer.id, consumer);

        await emitWithAck<{ resumed: true }>("resume-consumer", {
          roomId: currentRoomId,
          consumerId: consumer.id,
        });

        producerSourceRef.current.set(producerId, isScreen ? "screen" : "camera");

        const existing = streamsRef.current.get(producerSocketId);
        const stream = existing
          ? new MediaStream([...existing.getTracks(), consumer.track])
          : new MediaStream([consumer.track]);
        streamsRef.current.set(producerSocketId, stream);
        updateFn();
      } catch (err) {
        console.error("[mediasoup] consumeProducer failed:", err);
        consumedProducerIds.current.delete(producerId);
      }
    },
    [emitWithAck, updateRemoteStreams, updateRemoteScreenStreams]
  );

  // Auto-initialize device + recv transport when roomId is set,
  // then fetch and consume all existing producers in the room
  useEffect(() => {
    if (!socket || !roomId || receivingInitRef.current) return;
    receivingInitRef.current = true;

    (async () => {
      try {
        const device = await ensureDevice();
        await createRecvTransport(device);

        const { producers } = await emitWithAck<ExistingProducersResponse>(
          "get-producers",
          { roomId }
        );

        for (const p of producers) {
          await consumeProducer(p.producerId, p.producerSocketId, p.appData);
        }

        const pending = [...pendingProducersRef.current];
        pendingProducersRef.current = [];
        for (const p of pending) {
          await consumeProducer(p.producerId, p.producerSocketId, p.appData);
        }
      } catch (err) {
        console.error("[mediasoup] Failed to initialize receiving:", err);
        receivingInitRef.current = false;
      }
    })();
  }, [socket, roomId, ensureDevice, createRecvTransport, emitWithAck, consumeProducer]);

  const startProducing = useCallback(async () => {
    const device = await ensureDevice();
    const sendTransport = await createSendTransport(device);
    await createRecvTransport(device);

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Camera/mic access requires HTTPS. Please use a secure connection."
      );
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setLocalStream(stream);

    for (const track of stream.getTracks()) {
      const producer = await sendTransport.produce({ track });
      producersRef.current.set(producer.id, producer);
    }
  }, [ensureDevice, createSendTransport, createRecvTransport]);

  const stopScreenShare = useCallback(() => {
    const producer = screenProducerRef.current;
    const currentRoomId = roomIdRef.current;
    if (producer && !producer.closed) {
      if (currentRoomId) {
        socketRef.current?.emit(
          "close-producer",
          { roomId: currentRoomId, producerId: producer.id },
          () => {}
        );
      }
      producer.close();
      producersRef.current.delete(producer.id);
    }
    screenProducerRef.current = null;
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
  }, []);

  const startScreenShare = useCallback(async () => {
    if (screenProducerRef.current) return;

    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("Screen sharing is not supported on this device or browser.");
    }

    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    const track = displayStream.getVideoTracks()[0];

    const device = await ensureDevice();
    const sendTransport = await createSendTransport(device);

    const producer = await sendTransport.produce({
      track,
      appData: { source: "screen" },
    });

    screenProducerRef.current = producer;
    producersRef.current.set(producer.id, producer);
    screenStreamRef.current = new MediaStream([track]);
    setScreenStream(screenStreamRef.current);

    track.addEventListener("ended", () => stopScreenShare());
    producer.on("transportclose", () => {
      screenProducerRef.current = null;
      screenStreamRef.current = null;
      setScreenStream(null);
    });
  }, [ensureDevice, createSendTransport, stopScreenShare]);

  const close = useCallback(() => {
    for (const producer of producersRef.current.values()) {
      producer.close();
    }
    producersRef.current.clear();

    for (const consumer of consumersRef.current.values()) {
      consumer.close();
    }
    consumersRef.current.clear();

    sendTransportRef.current?.close();
    sendTransportRef.current = null;
    recvTransportRef.current?.close();
    recvTransportRef.current = null;
    deviceRef.current = null;
    deviceInitPromise.current = null;
    sendTransportInitPromise.current = null;
    recvTransportInitPromise.current = null;
    receivingInitRef.current = false;
    consumedProducerIds.current.clear();
    pendingProducersRef.current = [];
    producerSourceRef.current.clear();

    if (screenProducerRef.current && !screenProducerRef.current.closed) {
      screenProducerRef.current.close();
    }
    screenProducerRef.current = null;
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);

    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setLocalStream(null);

    remoteStreamsRef.current.clear();
    setRemoteStreams(new Map());
    remoteScreenStreamsRef.current.clear();
    setRemoteScreenStreams(new Map());
  }, [localStream]);

  // Listen for new producers (real-time) and peer disconnections
  useEffect(() => {
    const s = socketRef.current;
    if (!s || !roomId) return;

    const handleNewProducer = (payload: NewProducerPayload) => {
      if (payload.producerSocketId === s.id) return;
      consumeProducer(payload.producerId, payload.producerSocketId, payload.appData).catch(
        console.error
      );
    };

    const handleProducerClosed = (payload: ProducerClosedPayload) => {
      consumedProducerIds.current.delete(payload.producerId);
      const source = producerSourceRef.current.get(payload.producerId);
      producerSourceRef.current.delete(payload.producerId);

      const streamsRef = source === "screen" ? remoteScreenStreamsRef : remoteStreamsRef;
      const updateFn = source === "screen" ? updateRemoteScreenStreams : updateRemoteStreams;

      for (const [id, consumer] of consumersRef.current) {
        if (consumer.producerId === payload.producerId) {
          consumer.close();
          consumersRef.current.delete(id);

          const stream = streamsRef.current.get(payload.producerSocketId);
          if (stream) {
            const remaining = stream.getTracks().filter((t) => t !== consumer.track);
            if (remaining.length === 0) {
              streamsRef.current.delete(payload.producerSocketId);
            } else {
              streamsRef.current.set(payload.producerSocketId, new MediaStream(remaining));
            }
          }
          updateFn();
          break;
        }
      }
    };

    const handlePeerLeft = (payload: PeerLeftPayload) => {
      for (const [id, consumer] of consumersRef.current) {
        const camStream = remoteStreamsRef.current.get(payload.socketId);
        const scrStream = remoteScreenStreamsRef.current.get(payload.socketId);
        if (
          (camStream && camStream.getTracks().includes(consumer.track)) ||
          (scrStream && scrStream.getTracks().includes(consumer.track))
        ) {
          consumedProducerIds.current.delete(consumer.producerId);
          producerSourceRef.current.delete(consumer.producerId);
          consumer.close();
          consumersRef.current.delete(id);
        }
      }
      remoteStreamsRef.current.delete(payload.socketId);
      remoteScreenStreamsRef.current.delete(payload.socketId);
      updateRemoteStreams();
      updateRemoteScreenStreams();
    };

    s.on("new-producer", handleNewProducer);
    s.on("producer-closed", handleProducerClosed);
    s.on("peer-left", handlePeerLeft);

    return () => {
      s.off("new-producer", handleNewProducer);
      s.off("producer-closed", handleProducerClosed);
      s.off("peer-left", handlePeerLeft);
    };
  }, [roomId, consumeProducer, updateRemoteStreams]);

  return {
    localStream,
    remoteStreams,
    remoteScreenStreams,
    screenStream,
    startProducing,
    startScreenShare,
    stopScreenShare,
    close,
  };
}
