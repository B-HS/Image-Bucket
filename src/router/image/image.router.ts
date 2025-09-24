import { Hono } from 'hono'
import { authMiddleware } from '../../middleware'
import { uploadImage, getImage, getImagesList } from '../../service'

export const imageRouter = new Hono()

imageRouter.post('/upload', authMiddleware, async (c) => {
    try {
        const formData = await c.req.formData()
        const file = formData.get('file') as File

        if (!file || !(file instanceof File)) {
            return c.json({ error: 'No file provided' }, 400)
        }

        const result = await uploadImage(file, file.name)

        return c.json({
            uuid: result.uuid,
            sizes: result.sizes,
        })
    } catch (error) {
        console.error('Upload error:', error)
        return c.json({ error: 'Upload failed' }, 500)
    }
})

imageRouter.get('/list', authMiddleware, async (c) => {
    try {
        const images = getImagesList()
        return c.json(images)
    } catch (error) {
        console.error('List error:', error)
        return c.json({ error: 'Failed to list images' }, 500)
    }
})

imageRouter.get('/:filename', async (c) => {
    try {
        const filename = c.req.param('filename')
        const result = await getImage(filename)

        if (!result) {
            return c.json({ error: 'Image not found' }, 404)
        }

        c.header('Content-Type', result.mimeType)
        c.header('Cache-Control', 'public, max-age=31536000, immutable')

        return c.body(result.buffer as unknown as string | ReadableStream)
    } catch (error) {
        console.error('Get image error:', error)
        return c.json({ error: 'Failed to retrieve image' }, 500)
    }
})
