import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T = unknown> {
    code: number;
    data: T;
    msg: string;
}

@Injectable()
export class TransformInterceptor<T = unknown> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(_ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map((data: T): ApiResponse<T> => ({
                code: 0,
                data,
                msg: 'ok'
            }))
        );
    }
}
