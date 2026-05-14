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
} from "../types/index";

export function useMediasoup(socket: TypedSocket | null, roomId: string | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );

  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const producersRef = useRef<Map<string, Producer>>(new Map());
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const roomIdRef = useRef<string | null>(null);
  const socketRef = useRef<TypedSocket | null>(null);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const updateRemoteStreams = useCallback(() => {
    setRemoteStreams(new Map(remoteStreamsRef.current));
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

  const initializeDevice = useCallback(async (): Promise<Device> => {
    const currentRoomId = roomIdRef.current;
    if (!currentRoomId) throw new Error("No room ID");

    const { rtpCapabilities } = await emitWithAck<RtpCapabilitiesResponse>(
      "get-rtp-capabilities",
      { roomId: currentRoomId }
    );

    const device = new Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    deviceRef.current = device;
    return device;
  }, [emitWithAck]);

  const createSendTransport = useCallback(
    async (device: Device): Promise<Transport> => {
      const currentRoomId = roomIdRef.current;
      if (!currentRoomId) throw new Error("No room ID");

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
    },
    [emitWithAck]
  );

  const createRecvTransport = useCallback(
    async (device: Device): Promise<Transport> => {
      const currentRoomId = roomIdRef.current;
      if (!currentRoomId) throw new Error("No room ID");

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
    },
    [emitWithAck]
  );

  const consumeProducer = useCallback(
    async (producerId: string, producerSocketId: string) => {
      const currentRoomId = roomIdRef.current;
      const device = deviceRef.current;
      const recvTransport = recvTransportRef.current;

      if (!currentRoomId || !device || !recvTransport) return;

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

      const existing =
        remoteStreamsRef.current.get(producerSocketId) || new MediaStream();
      existing.addTrack(consumer.track);
      remoteStreamsRef.current.set(producerSocketId, existing);
      updateRemoteStreams();
    },
    [emitWithAck, updateRemoteStreams]
  );

  const startProducing = useCallback(async () => {
    const device = await initializeDevice();
    const sendTransport = await createSendTransport(device);
    await createRecvTransport(device);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setLocalStream(stream);

    for (const track of stream.getTracks()) {
      const producer = await sendTransport.produce({ track });
      producersRef.current.set(producer.id, producer);
    }
  }, [initializeDevice, createSendTransport, createRecvTransport]);

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

    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    setLocalStream(null);

    remoteStreamsRef.current.clear();
    setRemoteStreams(new Map());
  }, [localStream]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s || !roomId) return;

    const handleNewProducer = (payload: NewProducerPayload) => {
      if (payload.producerSocketId === s.id) return;
      consumeProducer(payload.producerId, payload.producerSocketId).catch(
        console.error
      );
    };

    const handleProducerClosed = (payload: ProducerClosedPayload) => {
      for (const [id, consumer] of consumersRef.current) {
        if (consumer.producerId === payload.producerId) {
          consumer.close();
          consumersRef.current.delete(id);

          const stream = remoteStreamsRef.current.get(
            payload.producerSocketId
          );
          if (stream) {
            stream.removeTrack(consumer.track);
            if (stream.getTracks().length === 0) {
              remoteStreamsRef.current.delete(payload.producerSocketId);
            }
          }
          updateRemoteStreams();
          break;
        }
      }
    };

    const handlePeerLeft = (payload: PeerLeftPayload) => {
      for (const [id, consumer] of consumersRef.current) {
        const stream = remoteStreamsRef.current.get(payload.socketId);
        if (stream && stream.getTracks().includes(consumer.track)) {
          consumer.close();
          consumersRef.current.delete(id);
        }
      }
      remoteStreamsRef.current.delete(payload.socketId);
      updateRemoteStreams();
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
    startProducing,
    close,
  };
}
