import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request } from "express";
import { Observable, tap } from "rxjs";
import { AuditService } from "./audit.service";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: { sub?: string } }>();
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return next.handle();
    return next.handle().pipe(
      tap(data => {
        const resourceId = data && typeof data === "object" && "id" in data ? String(data.id) : undefined;
        const requestIdHeader = request.headers["x-request-id"];
        void this.audit.record({
          actorUserId: request.user?.sub,
          action: request.method.toLowerCase(),
          resourceType: request.path,
          resourceId,
          requestId: typeof requestIdHeader === "string" ? requestIdHeader : undefined
        });
      })
    );
  }
}
