import { applyDecorators, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { AllExceptionFilter } from '../filters/all-exception.filter';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { AuditInterceptor } from '@/modules/audit/audit.interceptor';

/** Applies Pavilion's API envelope, authentication, authorization and error handling locally. */
export function PlatformApi(): ClassDecorator {
    return applyDecorators(
        UseGuards(JwtAuthGuard, RolesGuard),
        UseInterceptors(AuditInterceptor, TransformInterceptor),
        UseFilters(AllExceptionFilter)
    );
}
