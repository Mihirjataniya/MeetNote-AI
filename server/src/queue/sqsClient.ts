import { SQSClient } from "@aws-sdk/client-sqs";
import { config } from "../config/index";

// A single shared SQS client. When config.sqs.endpoint is set (ElasticMQ /
// LocalStack) we pass explicit dummy-friendly credentials and the custom
// endpoint; against real AWS we let the default credential provider chain
// (env vars, shared config, IAM role) resolve creds unless they were given
// explicitly.
const useExplicitCreds = Boolean(config.sqs.accessKeyId && config.sqs.secretAccessKey);

export const sqs = new SQSClient({
  region: config.sqs.region,
  ...(config.sqs.endpoint ? { endpoint: config.sqs.endpoint } : {}),
  ...(useExplicitCreds
    ? {
        credentials: {
          accessKeyId: config.sqs.accessKeyId,
          secretAccessKey: config.sqs.secretAccessKey,
        },
      }
    : {}),
});
