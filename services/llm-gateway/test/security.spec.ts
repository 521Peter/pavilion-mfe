import { ConfigService } from '@nestjs/config';
import { SecretEncryptionService } from '@/common/security/secret-encryption.service';
import { UrlSafetyService } from '@/common/security/url-safety.service';
import { SkillLoaderService } from '@/modules/skill/services/skill-loader.service';

describe('gateway security boundaries', () => {
    it('encrypts provider credentials with authenticated encryption', () => {
        const config = new ConfigService({ app: { credentialEncryptionKey: Buffer.alloc(32, 7).toString('base64') } });
        const service = new SecretEncryptionService(config);
        const encrypted = service.encrypt('sk-secret-value');
        expect(encrypted).not.toContain('sk-secret-value');
        expect(service.decrypt(encrypted)).toBe('sk-secret-value');
    });

    it('rejects private provider URLs when production policy is enabled', async () => {
        const service = new UrlSafetyService(new ConfigService({ app: { allowPrivateProviderUrls: false } }));
        await expect(service.assertSafe('http://127.0.0.1:11434')).rejects.toThrow('不允许访问');
    });

    it('rejects skill path traversal', async () => {
        const loader = new SkillLoaderService();
        await expect(loader.readFile('safe-skill', '../../outside.txt')).rejects.toThrow('路径越界');
    });
});
