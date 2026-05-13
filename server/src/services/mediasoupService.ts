import * as mediasoup from "mediasoup";
import type { Worker, Router, WebRtcTransport } from "mediasoup/types";
import { config } from "../config/index";
import type { TransportCreatedResponse } from "../types/index";

class MediasoupService {
  private worker: Worker | null = null;

  async initialize(): Promise<void> {
    this.worker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel,
      logTags: config.mediasoup.worker.logTags,
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });

    this.worker.on("died", (error) => {
      console.error("MediaSoup worker died:", error);
      process.exit(1);
    });

    console.log(`MediaSoup worker initialized (pid: ${this.worker.pid})`);
  }

  getWorker(): Worker {
    if (!this.worker) {
      throw new Error("MediaSoup worker not initialized — call initialize() first");
    }
    return this.worker;
  }

  async createRouter(): Promise<Router> {
    const worker = this.getWorker();
    return worker.createRouter({
      mediaCodecs: config.mediasoup.router.mediaCodecs,
    });
  }

  async createWebRtcTransport(
    router: Router
  ): Promise<{ transport: WebRtcTransport; params: TransportCreatedResponse }> {
    const transport = await router.createWebRtcTransport({
      listenInfos: config.mediasoup.webRtcTransport.listenInfos,
      enableUdp: config.mediasoup.webRtcTransport.enableUdp,
      enableTcp: config.mediasoup.webRtcTransport.enableTcp,
      preferUdp: config.mediasoup.webRtcTransport.preferUdp,
      initialAvailableOutgoingBitrate:
        config.mediasoup.webRtcTransport.initialAvailableOutgoingBitrate,
    });

    const params: TransportCreatedResponse = {
      id: transport.id,
      iceParameters: transport.iceParameters as unknown as Record<string, unknown>,
      iceCandidates: transport.iceCandidates as unknown as Record<string, unknown>[],
      dtlsParameters: transport.dtlsParameters,
    };

    return { transport, params };
  }

  async closeWorker(): Promise<void> {
    this.worker?.close();
    this.worker = null;
  }
}

export const mediasoupService = new MediasoupService();
