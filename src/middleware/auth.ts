import { Context, Next, MiddlewareHandler } from 'hono'

export const authMiddleware: MiddlewareHandler = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization')
    const authToken = process.env.AUTH_TOKEN

    if (!authHeader || authHeader !== `Bearer ${authToken}`) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    return await next()
}
