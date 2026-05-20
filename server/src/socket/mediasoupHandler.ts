import { Server, Socket } from "socket.io";
import { mediasoupService } from "../services/mediasoupService";
import { roomService } from "../services/roomService";
import type { MediaKind } from "mediasoup/types";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  PeerMedia,
} from "../types/index";

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

function getOrCreatePeerMedia(room: { peerMedia: Map<string, PeerMedia> }, socketId: string): PeerMedia {
  let media = room.peerMedia.get(socketId);
  if (!media) {
    media = {
      sendTransport: null,
      recvTransport: null,
      producers: new Map(),
      consumers: new Map(),
    };
    room.peerMedia.set(socketId, media);
  }
  return media;
}

export function registerMediasoupHandlers(io: TypedServer): void {
  io.on("connection", (socket: TypedSocket) => {
    socket.on("get-rtp-capabilities", async (payload, callback) => {
      try {
        if (!payload?.roomId || typeof payload.roomId !== "string") {
          callback({ message: "Room ID is required" });
          return;
        }

        const room = roomService.getRoom(payload.roomId);
        if (!room) {
          callback({ message: "Room not found" });
          return;
        }

        if (!room.router) {
          room.router = await mediasoupService.createRouter();
        }

        callback({ rtpCapabilities: room.router.rtpCapabilities });
      } catch {
        callback({ message: "Failed to get RTP capabilities" });
      }
    });

    socket.on("create-transport", async (payload, callback) => {
      try {
        if (!payload?.roomId || typeof payload.roomId !== "string") {
          callback({ message: "Room ID is required" });
          return;
        }
        if (payload.direction !== "send" && payload.direction !== "recv") {
          callback({ message: "Direction must be 'send' or 'recv'" });
          return;
        }

        const room = roomService.getRoom(payload.roomId);
        if (!room) {
          callback({ message: "Room not found" });
          return;
        }
        if (!room.router) {
          callback({ message: "Router not initialized — call get-rtp-capabilities first" });
          return;
        }

        const { transport, params } =
          await mediasoupService.createWebRtcTransport(room.router);

        const media = getOrCreatePeerMedia(room, socket.id);

        if (payload.direction === "send") {
          media.sendTransport = transport;
        } else {
          media.recvTransport = transport;
        }

        transport.on("dtlsstatechange", (dtlsState) => {
          if (dtlsState === "closed") {
            transport.close();
          }
        });

        callback(params);
      } catch {
        callback({ message: "Failed to create transport" });
      }
    });

    socket.on("connect-transport", async (payload, callback) => {
      try {
        if (!payload?.roomId || typeof payload.roomId !== "string") {
          callback({ message: "Room ID is required" });
          return;
        }
        if (!payload.transportId || typeof payload.transportId !== "string") {
          callback({ message: "Transport ID is required" });
          return;
        }
        if (!payload.dtlsParameters) {
          callback({ message: "DTLS parameters are required" });
          return;
        }

        const room = roomService.getRoom(payload.roomId);
        if (!room) {
          callback({ message: "Room not found" });
          return;
        }

        const media = room.peerMedia.get(socket.id);
        if (!media) {
          callback({ message: "No transports found for this peer" });
          return;
        }

        const transport =
          media.sendTransport?.id === payload.transportId
            ? media.sendTransport
            : media.recvTransport?.id === payload.transportId
              ? media.recvTransport
              : null;

        if (!transport) {
          callback({ message: "Transport not found" });
          return;
        }

        await transport.connect({ dtlsParameters: payload.dtlsParameters });
        callback({ connected: true });
      } catch {
        callback({ message: "Failed to connect transport" });
      }
    });

    socket.on("produce", async (payload, callback) => {
      try {
        if (!payload?.roomId || typeof payload.roomId !== "string") {
          callback({ message: "Room ID is required" });
          return;
        }
        if (!payload.transportId || typeof payload.transportId !== "string") {
          callback({ message: "Transport ID is required" });
          return;
        }
        if (!payload.kind || !payload.rtpParameters) {
          callback({ message: "Kind and RTP parameters are required" });
          return;
        }

        const room = roomService.getRoom(payload.roomId);
        if (!room) {
          callback({ message: "Room not found" });
          return;
        }

        const media = room.peerMedia.get(socket.id);
        if (!media?.sendTransport || media.sendTransport.id !== payload.transportId) {
          callback({ message: "Send transport not found" });
          return;
        }

        const producer = await media.sendTransport.produce({
          kind: payload.kind,
          rtpParameters: payload.rtpParameters,
          appData: payload.appData,
        });

        media.producers.set(producer.id, producer);

        producer.on("transportclose", () => {
          media.producers.delete(producer.id);
        });

        socket.to(payload.roomId).emit("new-producer", {
          roomId: payload.roomId,
          producerId: producer.id,
          producerSocketId: socket.id,
          kind: producer.kind,
          appData: producer.appData as Record<string, unknown>,
        });

        callback({ producerId: producer.id });
      } catch {
        callback({ message: "Failed to produce" });
      }
    });

    socket.on("consume", async (payload, callback) => {
      try {
        if (!payload?.roomId || typeof payload.roomId !== "string") {
          callback({ message: "Room ID is required" });
          return;
        }
        if (!payload.producerId || typeof payload.producerId !== "string") {
          callback({ message: "Producer ID is required" });
          return;
        }
        if (!payload.rtpCapabilities) {
          callback({ message: "RTP capabilities are required" });
          return;
        }

        const room = roomService.getRoom(payload.roomId);
        if (!room?.router) {
          callback({ message: "Room or router not found" });
          return;
        }

        const canConsume = room.router.canConsume({
          producerId: payload.producerId,
          rtpCapabilities: payload.rtpCapabilities,
        });
        if (!canConsume) {
          callback({ message: "Cannot consume — incompatible RTP capabilities" });
          return;
        }

        const media = room.peerMedia.get(socket.id);
        if (!media?.recvTransport) {
          callback({ message: "Receive transport not found" });
          return;
        }

        const consumer = await media.recvTransport.consume({
          producerId: payload.producerId,
          rtpCapabilities: payload.rtpCapabilities,
          paused: true,
        });

        media.consumers.set(consumer.id, consumer);

        consumer.on("transportclose", () => {
          media.consumers.delete(consumer.id);
        });

        consumer.on("producerclose", () => {
          media.consumers.delete(consumer.id);
        });

        callback({
          consumerId: consumer.id,
          producerId: consumer.producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
      } catch {
        callback({ message: "Failed to consume" });
      }
    });

    socket.on("resume-consumer", async (payload, callback) => {
      try {
        if (!payload?.roomId || typeof payload.roomId !== "string") {
          callback({ message: "Room ID is required" });
          return;
        }
        if (!payload.consumerId || typeof payload.consumerId !== "string") {
          callback({ message: "Consumer ID is required" });
          return;
        }

        const room = roomService.getRoom(payload.roomId);
        if (!room) {
          callback({ message: "Room not found" });
          return;
        }

        const media = room.peerMedia.get(socket.id);
        if (!media) {
          callback({ message: "No media state found for this peer" });
          return;
        }

        const consumer = media.consumers.get(payload.consumerId);
        if (!consumer) {
          callback({ message: "Consumer not found" });
          return;
        }

        await consumer.resume();
        callback({ resumed: true });
      } catch {
        callback({ message: "Failed to resume consumer" });
      }
    });

    socket.on("get-producers", (payload, callback) => {
      try {
        if (!payload?.roomId || typeof payload.roomId !== "string") {
          callback({ message: "Room ID is required" });
          return;
        }

        const room = roomService.getRoom(payload.roomId);
        if (!room) {
          callback({ message: "Room not found" });
          return;
        }

        const producers: { producerId: string; producerSocketId: string; kind: MediaKind; appData?: Record<string, unknown> }[] = [];
        for (const [peerId, media] of room.peerMedia) {
          if (peerId === socket.id) continue;
          for (const [producerId, producer] of media.producers) {
            if (!producer.closed) {
              producers.push({
                producerId,
                producerSocketId: peerId,
                kind: producer.kind,
                appData: producer.appData as Record<string, unknown>,
              });
            }
          }
        }

        callback({ producers });
      } catch {
        callback({ message: "Failed to get producers" });
      }
    });

    socket.on("close-producer", (payload, callback) => {
      try {
        if (!payload?.roomId || !payload.producerId) {
          callback({ message: "roomId and producerId are required" });
          return;
        }
        const room = roomService.getRoom(payload.roomId);
        const media = room?.peerMedia.get(socket.id);
        const producer = media?.producers.get(payload.producerId);
        if (producer && !producer.closed) {
          producer.close();
          media!.producers.delete(payload.producerId);
          socket.to(payload.roomId).emit("producer-closed", {
            roomId: payload.roomId,
            producerId: payload.producerId,
            producerSocketId: socket.id,
          });
        }
        callback({ closed: true });
      } catch {
        callback({ message: "Failed to close producer" });
      }
    });

    socket.on("disconnect", () => {
      for (const roomId of socket.data.rooms) {
        const room = roomService.getRoom(roomId);
        if (!room) continue;

        const media = room.peerMedia.get(socket.id);
        if (!media) continue;

        for (const [producerId] of media.producers) {
          socket.to(roomId).emit("producer-closed", {
            roomId,
            producerId,
            producerSocketId: socket.id,
          });
        }
      }
    });
  });
}
