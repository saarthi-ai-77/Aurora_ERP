import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      console.error('[RolesGuard] No user found on request. Ensure JwtAuthGuard is running before RolesGuard.');
      return false;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      console.warn(`[RolesGuard] User ${user.userId} with role ${user.role} does not have required roles: ${requiredRoles}`);
    }
    
    return hasRole;
  }
}
