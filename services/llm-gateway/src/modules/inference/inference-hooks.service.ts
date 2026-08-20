import { Injectable, Logger } from '@nestjs/common';
import { SpanStatusCode, trace, type Span } from '@opentelemetry/api';

@Injectable()
export class InferenceHooksService {
    private readonly logger = new Logger(InferenceHooksService.name);
    private readonly tracer = trace.getTracer('pavilion-llm-gateway');
    private readonly attemptSpans = new Map<string, Span>();

    onRequest(requestId: string): void {
        this.logger.debug(`onRequest ${requestId}`);
    }

    beforeAttempt(requestId: string, deploymentId: string, attempt: number): void {
        this.logger.debug(`beforeAttempt ${requestId} ${deploymentId} ${attempt}`);
        this.attemptSpans.set(
            `${requestId}:${deploymentId}`,
            this.tracer.startSpan('llm.provider.attempt', {
                attributes: { 'llm.request.id': requestId, 'llm.deployment.id': deploymentId, 'llm.attempt': attempt }
            })
        );
    }

    afterAttempt(requestId: string, deploymentId: string, status: string): void {
        this.logger.debug(`afterAttempt ${requestId} ${deploymentId} ${status}`);
        const key = `${requestId}:${deploymentId}`;
        const span = this.attemptSpans.get(key);
        if (span) {
            span.setStatus({ code: status === 'success' ? SpanStatusCode.OK : SpanStatusCode.ERROR });
            span.end();
            this.attemptSpans.delete(key);
        }
    }

    onStreamChunk(_requestId: string, _chunk: string): void {}
    onResponse(requestId: string): void {
        this.logger.debug(`onResponse ${requestId}`);
    }

    onError(requestId: string, error: unknown): void {
        this.logger.warn(`onError ${requestId}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
