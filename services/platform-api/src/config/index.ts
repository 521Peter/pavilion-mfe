import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  port: parseInt(process.env.PORT ?? "3000", 10),
  prefix: process.env.API_PREFIX ?? "api",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:6019",
  jwtSecret: process.env.JWT_SECRET ?? "pavilion-mfe-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  seedAdminUsername: process.env.SEED_ADMIN_USERNAME ?? "admin",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "admin123"
}));
