import { Module } from '@nestjs/common';
import { McpServerService } from './services/mcp-server.service';
import { McpClientService } from './services/mcp-client.service';
import { McpController } from './controllers/mcp.controller';

@Module({
    controllers: [McpController],
    providers: [McpServerService, McpClientService],
    exports: [McpServerService, McpClientService]
})
export class McpModule {}
