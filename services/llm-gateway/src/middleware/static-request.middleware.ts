import { IncomingMessage } from "http";
import { ProxyValidation, ProxyValidationHandler } from "@hodfords/api-gateway";

@ProxyValidation()
export class StaticRequestMiddleware implements ProxyValidationHandler {
  isStaticRequest(request: IncomingMessage): boolean {
    const url = request.url ?? "";
    return url.includes("/images/") || url.includes("/statics/");
  }
}
