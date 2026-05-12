import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip;
    const startTime = Date.now();
    const requestId = uuidv4();
    
    // Attach request ID for downstream use
    (req as any).requestId = requestId;

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const duration = Date.now() - startTime;

      this.logger.log(
        `[${requestId}] ${method} ${originalUrl} ${statusCode} ${contentLength || 0}b - ${duration}ms - ${userAgent} ${ip}`
      );
    });

    next();
  }
}
