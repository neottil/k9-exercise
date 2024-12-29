import { AuthUser } from 'aws-amplify/auth';

interface OutletRouterContext {user: AuthUser};

export type {
    OutletRouterContext
}