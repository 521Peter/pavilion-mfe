import { All, Controller, Req, Res } from '@nestjs/common';
import { ProxyService } from '../services/proxy.service';

@Controller()
export class ProxyController {
    constructor(private proxyService: ProxyService) {}

    // 接口转发给子应用
    @All('/{*splat}')
    async proxy(@Req() req, @Res() res): Promise<void> {
        await this.proxyService.handleRequest(req, res);
    }
}
