import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import type {
  RtpCodecCapability,
  TransportListenInfo,
  WorkerLogLevel,
  WorkerLogTag,
} from "mediasoup/types";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  appUrl: process.env.APP_URL || "http://localhost:5173",
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
  },
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/meetnote",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d" as const,
  },
  recordings: {
    dir: path.join(path.dirname(fileURLToPath(import.meta.url)), "../../recordings"),
  },
  deepgram: {
    apiKey: process.env.DEEPGRAM_API_KEY || "",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-flash-latest",
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || "",
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  },
  sqs: {
    region: process.env.AWS_REGION || "us-east-1",
    // Set for local emulators (ElasticMQ http://localhost:9324, LocalStack
    // http://localhost:4566). Leave unset to hit real AWS SQS.
    endpoint: process.env.SQS_ENDPOINT || undefined,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    queuePrefix: process.env.SQS_QUEUE_PREFIX || "meetnote",
    // When true, the SQS consumer loops run inside this process. Set false to
    // run the API/socket server without workers (workers run via a separate
    // entry point in a multi-process deployment).
    workerEnabled: process.env.SQS_WORKER_ENABLED !== "false",
    // Deliveries before a message is sent to its dead-letter queue.
    maxReceiveCount: parseInt(process.env.SQS_MAX_RECEIVE_COUNT || "5", 10),
  },
  webPush: {
    publicKey: process.env.VAPID_PUBLIC_KEY || "",
    privateKey: process.env.VAPID_PRIVATE_KEY || "",
    subject: process.env.VAPID_SUBJECT || "mailto:noreply@meetnote.local",
  },
  mediasoup: {
    worker: {
      logLevel: "warn" as WorkerLogLevel,
      logTags: [
        "info",
        "ice",
        "dtls",
        "rtp",
        "srtp",
        "rtcp",
      ] as WorkerLogTag[],
      rtcMinPort: parseInt(process.env.RTC_MIN_PORT || "40000", 10),
      rtcMaxPort: parseInt(process.env.RTC_MAX_PORT || "49999", 10),
    },
    router: {
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: "video",
          mimeType: "video/VP8",
          clockRate: 90000,
          parameters: {
            "x-google-start-bitrate": 1000,
          },
        },
      ] as RtpCodecCapability[],
    },
    webRtcTransport: {
      listenInfos: [
        {
          protocol: "udp",
          ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
          announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || undefined,
        },
        {
          protocol: "tcp",
          ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
          announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP || undefined,
        },
      ] as TransportListenInfo[],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000,
    },
  },
};
