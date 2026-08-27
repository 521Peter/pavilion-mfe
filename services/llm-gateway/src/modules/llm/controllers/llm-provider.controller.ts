import { Controller, Get, Post, Put, Delete, Body, Param } from "@nestjs/common";
import { LlmProviderService } from "../services/llm-provider.service";
import { CreateProviderDto, UpdateProviderDto } from "../dto/provider.dto";
import { CreateModelDto, UpdateModelDto } from "../dto/model.dto";
import { Roles } from "@/common/decorators/roles.decorator";
import { PlatformApi } from "@/common/decorators/platform-api.decorator";

@PlatformApi()
@Controller("api/llm")
export class LlmProviderController {
  constructor(private readonly providerService: LlmProviderService) {}

  // ── 平台元信息 ──

  @Get("types")
  getSupportedTypes() {
    return this.providerService.getSupportedTypes();
  }

  @Get("models")
  listAvailableModels() {
    return this.providerService.listAvailableModels();
  }

  // ── 提供商增删改查 ──

  @Get("providers")
  listProviders() {
    return this.providerService.listProviders();
  }

  @Get("providers/:id")
  getProvider(@Param("id") id: string) {
    return this.providerService.getProvider(id);
  }

  @Post("providers")
  @Roles("ADMIN")
  createProvider(@Body() dto: CreateProviderDto) {
    return this.providerService.createProvider(dto);
  }

  @Put("providers/:id")
  @Roles("ADMIN")
  updateProvider(@Param("id") id: string, @Body() dto: UpdateProviderDto) {
    return this.providerService.updateProvider(id, dto);
  }

  @Delete("providers/:id")
  @Roles("ADMIN")
  async deleteProvider(@Param("id") id: string) {
    await this.providerService.deleteProvider(id);
    return { success: true };
  }

  // ── 模型增删改查 ──

  @Get("providers/:id/models")
  listModels(@Param("id") providerId: string) {
    return this.providerService.listModels(providerId);
  }

  @Post("providers/:id/models")
  @Roles("ADMIN")
  createModel(@Param("id") providerId: string, @Body() dto: CreateModelDto) {
    return this.providerService.createModel(providerId, dto);
  }

  @Put("models/:id")
  @Roles("ADMIN")
  updateModel(@Param("id") id: string, @Body() dto: UpdateModelDto) {
    return this.providerService.updateModel(id, dto);
  }

  @Delete("models/:id")
  @Roles("ADMIN")
  async deleteModel(@Param("id") id: string) {
    await this.providerService.deleteModel(id);
    return { success: true };
  }
}
