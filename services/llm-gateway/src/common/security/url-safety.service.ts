import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function isPrivateIp(address: string): boolean {
  const normalized = address.toLowerCase();
  if (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  ) {
    return true;
  }
  if (normalized.startsWith("::ffff:")) return isPrivateIp(normalized.slice(7));
  if (isIP(normalized) !== 4) return false;
  const [a, b] = normalized.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

@Injectable()
export class UrlSafetyService {
  private readonly allowPrivate: boolean;

  constructor(config: ConfigService) {
    this.allowPrivate = config.get<boolean>("app.allowPrivateProviderUrls") ?? false;
  }

  async assertSafe(rawUrl: string | undefined): Promise<void> {
    if (!rawUrl) return;
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new BadRequestException("URL 格式无效");
    }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      throw new BadRequestException("只允许不含用户凭据的 HTTP/HTTPS URL");
    }
    if (this.allowPrivate) return;

    const results = await lookup(url.hostname, { all: true, verbatim: true }).catch(() => {
      throw new BadRequestException("URL 主机无法解析");
    });
    if (results.length === 0 || results.some(result => isPrivateIp(result.address))) {
      throw new BadRequestException("不允许访问本机、链路本地或私网地址");
    }
  }
}
