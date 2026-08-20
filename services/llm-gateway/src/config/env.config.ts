import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { ConnectionOptions } from 'tls';
import { ApiServiceDetail } from '@hodfords/api-gateway';

dotenv.config({ quiet: true });

function parseApiServices(value: string | undefined): ApiServiceDetail[] {
    if (!value) {
        return [];
    }

    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
        throw new Error('API_SERVICES must be a JSON array');
    }

    return parsed.map((service) => {
        if (!service || typeof service !== 'object') {
            throw new Error('Each API_SERVICES entry must be an object');
        }
        const candidate = service as Partial<ApiServiceDetail>;
        if (!candidate.prefix || !candidate.docUrl) {
            throw new Error('Each API_SERVICES entry requires prefix and docUrl');
        }
        return {
            ...candidate,
            host: candidate.host || new URL(candidate.docUrl).origin
        } as ApiServiceDetail;
    });
}

/**
 * Builds the TLS options for Redis from the environment.
 * Returns `undefined` when `REDIS_TLS` is not enabled, so the connection stays plain TCP.
 */
function buildRedisTls(): ConnectionOptions | undefined {
    if (process.env.REDIS_TLS !== 'true') {
        return undefined;
    }

    return {
        ...(process.env.REDIS_TLS_CA_FILE ? { ca: readFileSync(process.env.REDIS_TLS_CA_FILE) } : {}),
        ...(process.env.REDIS_TLS_CERT_FILE ? { cert: readFileSync(process.env.REDIS_TLS_CERT_FILE) } : {}),
        ...(process.env.REDIS_TLS_KEY_FILE ? { key: readFileSync(process.env.REDIS_TLS_KEY_FILE) } : {}),
        ...(process.env.REDIS_TLS_SERVERNAME ? { servername: process.env.REDIS_TLS_SERVERNAME } : {}),
        ...(process.env.REDIS_TLS_REJECT_UNAUTHORIZED === 'false' ? { rejectUnauthorized: false } : {})
    };
}

/**
 * Microservices which the gateway invokes and aggregates their results.
 * Declared as a structured object — `host` is derived from `docUrl`.
 * `directPrefixes` (optional) are forwarded to the service WITHOUT stripping the prefix.
 */
const apiServices = parseApiServices(process.env.API_SERVICES);
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:6019')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.JWT_SECRET || !process.env.CREDENTIAL_ENCRYPTION_KEY || !process.env.APPLICATION_KEY_PEPPER)
) {
    throw new Error('JWT_SECRET, CREDENTIAL_ENCRYPTION_KEY and APPLICATION_KEY_PEPPER are required in production');
}

export const env = {
    APP_PORT: Number(process.env.PORT || process.env.APP_PORT) || 3000, //API Gateway Port
    CORS_ORIGINS: corsOrigins,
    API_SERVICES: apiServices, //Microservices which the gateway invokes and aggregates their results.
    REDIS: {
        HOST: process.env.REDIS_HOST, //Redis host
        PORT: Number(process.env.REDIS_PORT || '6379'), //Redis port
        DB: Number(process.env.REDIS_DB || '0'), //Redis DB
        USERNAME: process.env.REDIS_USERNAME, //Redis username (ACL)
        PASSWORD: process.env.REDIS_PASSWORD, //Redis password
        TLS: buildRedisTls() //Redis TLS options, undefined when REDIS_TLS is not "true"
    }
};
