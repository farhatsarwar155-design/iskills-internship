import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];
  const accessSecret = process.env.JWT_ACCESS_SECRET || 'default_access_secret_key_123_change_in_production';

  try {
    const decoded = jwt.verify(token, accessSecret) as {
      id: string;
      email: string;
      role: string;
      name: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ message: 'Invalid or revoked access token' });
  }
};

export const requireRoles = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // ── Log the unauthorized access attempt to SystemLog ──────────────
      const attemptedRoute = req.method + ' ' + req.originalUrl;
      try {
        const { logAction } = await import('../utils/logger');
        await logAction({
          userId: req.user.id,
          userEmail: req.user.email,
          action: 'UNAUTHORIZED_ACCESS',
          module: 'ACCESS_CONTROL',
          description: `Access denied for role [${req.user.role}] on route: ${attemptedRoute}. Required roles: [${allowedRoles.join(', ')}]`,
          ipAddress: req.ip,
          severity: 'WARNING'
        });
      } catch (err) {
        console.error('Failed to write access-denied audit log:', err);
      }

      return res.status(403).json({
        message: `Forbidden: Access restricted. Required roles: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

export const auditLogger = (moduleName: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const method = req.method;
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      let action = 'UNKNOWN';
      if (method === 'POST') action = `CREATE_RECORD`;
      if (method === 'PUT' || method === 'PATCH') action = `UPDATE_RECORD`;
      if (method === 'DELETE') action = `DELETE_RECORD`;

      res.on('finish', () => {
        const userId = req.user?.id;
        const userEmail = req.user?.email;
        const ipAddress = req.ip;

        import('../utils/logger').then(({ logAction }) => {
          logAction({
            userId,
            userEmail,
            action,
            module: moduleName,
            description: `${method} ${req.originalUrl} - Status: ${res.statusCode}`,
            ipAddress,
            severity: res.statusCode >= 400 ? 'WARNING' : 'INFO'
          });
        }).catch(err => console.error('Error importing logger:', err));
      });
    }
    next();
  };
};

