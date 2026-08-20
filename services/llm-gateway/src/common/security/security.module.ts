import { Global, Module } from '@nestjs/common';
import { SecretEncryptionService } from './secret-encryption.service';
import { UrlSafetyService } from './url-safety.service';

@Global()
@Module({
    providers: [SecretEncryptionService, UrlSafetyService],
    exports: [SecretEncryptionService, UrlSafetyService]
})
export class SecurityModule {}
