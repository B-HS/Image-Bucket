import { Hono } from 'hono'
import { authMiddleware } from '../../middleware'
import { uploadFile, getFile, getFilesList } from '../../service'

export const fileRouter = new Hono()

fileRouter.post('/upload', authMiddleware, async (c) => {
    try {
        const formData = await c.req.formData()
        const file = formData.get('file') as File

        if (!file || !(file instanceof File)) {
            return c.json({ error: 'No file provided' }, 400)
        }

        const result = await uploadFile(file, file.name)

        return c.json({
            uuid: result.uuid,
        })
    } catch (error) {
        console.error('Upload error:', error)
        return c.json({ error: 'Upload failed' }, 500)
    }
})

fileRouter.get('/list', authMiddleware, async (c) => {
    try {
        const files = getFilesList()
        return c.json(files)
    } catch (error) {
        console.error('List error:', error)
        return c.json({ error: 'Failed to list files' }, 500)
    }
})

fileRouter.get('/:uuid', async (c) => {
    try {
        const uuid = c.req.param('uuid')
        const result = await getFile(uuid)

        if (!result) {
            return c.json({ error: 'File not found' }, 404)
        }

        c.header('Content-Type', result.metadata.mimeType)
        c.header('Content-Disposition', `attachment; filename="${result.metadata.originalName}"`)

        return c.body(result.buffer as unknown as string | ReadableStream)
    } catch (error) {
        console.error('Get file error:', error)
        return c.json({ error: 'Failed to retrieve file' }, 500)
    }
})
