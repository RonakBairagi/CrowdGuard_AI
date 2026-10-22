import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Demo users catalog
export const DEMO_USERS: Record<string, AuthenticatedUser> = {
  admin: {
    id: 'usr-admin-1',
    name: 'Siddhartha Chatterjee (Chief Administrator)',
    email: 'admin@crowdguard.ai',
    role: 'ADMIN',
  },
  safety: {
    id: 'usr-safety-1',
    name: 'R. Roy (Senior Crowd Safety Inspector)',
    email: 'safety@crowdguard.ai',
    role: 'SAFETY_OFFICER',
  },
  manager: {
    id: 'usr-manager-1',
    name: 'Priyanka Ghosh (Venue Operations Manager)',
    email: 'manager@crowdguard.ai',
    role: 'VENUE_MANAGER',
  },
  organizer: {
    id: 'usr-organizer-1',
    name: 'Anirban Sen (Puja Committee Secretary)',
    email: 'organizer@crowdguard.ai',
    role: 'ORGANIZER',
  },
  public: {
    id: 'usr-public-1',
    name: 'Rohit Sen (Visitor Demo)',
    email: 'visitor@demo.com',
    role: 'PUBLIC',
  },
};

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check auth header or session role header
  const authRoleHeader = req.headers['x-user-role'] as string;
  const authUserHeader = req.headers['x-user-id'] as string;

  if (authUserHeader && DEMO_USERS[authUserHeader]) {
    req.user = DEMO_USERS[authUserHeader];
    return next();
  }

  if (authRoleHeader) {
    const matched = Object.values(DEMO_USERS).find(u => u.role === authRoleHeader.toUpperCase());
    if (matched) {
      req.user = matched;
      return next();
    }
  }

  // Fallback to Public user for open visitor requests
  req.user = DEMO_USERS.public;
  next();
}

/**
 * Server-side RBAC enforcer: Ensures only authorized roles can invoke sensitive operations.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access Denied: Role "${req.user.role}" does not have permission to execute this administrative operation. Required: [${allowedRoles.join(', ')}]` 
      });
    }

    next();
  };
}
