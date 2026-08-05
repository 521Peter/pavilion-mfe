import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let code = -1
    let msg = '服务器内部错误'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      if (typeof res === 'string') {
        msg = res
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>
        msg = (r.message as string) ?? exception.message
        // class-validator 错误数组取第一条
        if (Array.isArray(r.message) && r.message.length > 0) {
          msg = String(r.message[0])
        }
        code = (r.code as number) ?? status
      }
    } else {
      this.logger.error(
        `Unhandled exception: ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    response.status(status).json({
      code: code === -1 ? status : code,
      data: null,
      msg,
    })
  }
}
