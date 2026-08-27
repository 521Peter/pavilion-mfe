import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";

/**
 * 标记接口所需的角色，不标记则允许所有已登录用户访问。
 * 与 RolesGuard 配合使用，RolesGuard 作为 APP_GUARD 注册在 JwtAuthGuard 之后。
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
