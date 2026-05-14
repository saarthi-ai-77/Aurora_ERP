import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse } from '@shared/contracts/api.contracts';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map(data => {
        // If the response is already a paginated response (has data and pagination),
        // we don't want to double wrap it in another 'data' property.
        if (data && typeof data === 'object' && 'pagination' in data && 'data' in data) {
          return {
            success: true,
            ...data
          };
        }

        return {
          success: true,
          data: data !== undefined ? data : null,
        };
      })
    );
  }
}
