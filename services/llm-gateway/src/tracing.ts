import { tracing } from '../libs/opentelemetry';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
if (endpoint) {
    tracing({
        serviceName: process.env.OTEL_SERVICE_NAME ?? 'pavilion-llm-gateway',
        otlpUrl: endpoint.replace(/\/$/, ''),
        minDuration: Number(process.env.OTEL_MIN_DURATION_MS ?? '0')
    });
}
