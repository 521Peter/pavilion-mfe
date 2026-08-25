import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    credentialEncryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY,
    applicationKeyPepper: process.env.APPLICATION_KEY_PEPPER,
    allowPrivateProviderUrls:
        process.env.NODE_ENV !== 'production' || process.env.ALLOW_PRIVATE_PROVIDER_URLS === 'true'
}));
