import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { fileRouter, imageRouter } from './router'

const ENV = {
    PORT: process.env.PORT,
    AUTH_TOKEN: process.env.AUTH_TOKEN,
}

Object.entries(ENV).forEach(([key, env]) => {
    if (!env) {
        throw new Error(`Environment variable ${key} is not set`)
    }
})

const app = new Hono()
const PORT = parseInt(ENV.PORT!)

app.use('*', cors())
app.use('*', logger())

app.route('/', imageRouter)
app.route('/file', fileRouter)

console.log(`🚀 Server is running on port ${PORT}`)
console.log(`📁 Upload directory: ${process.cwd()}/uploads`)

export default {
    port: PORT,
    fetch: app.fetch,
}
