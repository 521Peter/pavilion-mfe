import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
    jwtSecret: process.env.JWT_SECRET ?? 'pavilion-mfe-dev-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    credentialEncryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY,
    applicationKeyPepper: process.env.APPLICATION_KEY_PEPPER ?? process.env.JWT_SECRET ?? 'pavilion-local-pepper',
    allowPrivateProviderUrls:
        process.env.NODE_ENV !== 'production' || process.env.ALLOW_PRIVATE_PROVIDER_URLS === 'true'
}));
