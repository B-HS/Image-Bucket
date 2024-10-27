import { readFileSync, writeFileSync } from 'fs'
import { Hono } from 'hono'
import { env } from 'hono/adapter'
import { cors } from 'hono/cors'
import { stream } from 'hono/streaming'
import sharp = require('sharp')

const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'tif', 'tiff', 'bmp', 'heic', 'heif', 'ico']

const app = new Hono()

const saveImageWithGeneratedThumbnail = async (file: File, folderPath: string, percentage: number) => {
    const fileBuffer = await file.arrayBuffer()
    const fullName = file.name
    const fileName = fullName.split('.')[0]
    const ext = fullName.split('.').pop()
    const path = `${folderPath}/${fileName}.${ext}`

    if (!ext || !imageExtensions.includes(ext)) {
        return { path, thumbnail: '' }
    }

    writeFileSync(path, new Uint8Array(fileBuffer))
    await sharp(fileBuffer)
        .metadata()
        .then((info) => {
            const width = info.width && Math.round((info.width * percentage) / 100)
            const height = info.height && Math.round((info.height * percentage) / 100)
            return sharp(fileBuffer).resize(width, height).toBuffer()
        })
        .then((output) => writeFileSync(`${folderPath}/${fileName}-thumbnail.webp`, new Uint8Array(output)))
    return { path, thumbnail: `${folderPath}/${fileName}-thumbnail.webp` }
}

app.get('/:imagename', async (c) => {
    const Env = env(c)
    const folderPath = (Env.folder_path as string) || '/Desktop'
    const imagename = c.req.param('imagename')
    const isThumbnail = c.req.query('thumbnail')
    const path = isThumbnail ? `${folderPath}/${imagename.split('.')[0]}-thumbnail.webp` : `${folderPath}/${imagename}`
    const image = readFileSync(path)

    return stream(c, async (stream) => {
        await stream.write(new Uint8Array(image)).then(() => stream.close())
    })
})

app.post('/image/upload/single', async (c) => {
    const Env = env(c)
    const folderPath = (Env.folder_path as string) || '/Desktop'
    const formData = await c.req.parseBody()
    const percentage = 25
    const file = formData['file']
    if (file instanceof File) {
        return c.json({
            image: saveImageWithGeneratedThumbnail(file, folderPath, percentage),
        })
    } else {
        return c.text('Invalid file', 400)
    }
})

app.post('/image/upload/multiple', async (c) => {
    const Env = env(c)
    const folderPath = (Env.folder_path as string) || '/Desktop'
    const formData = await c.req.parseBody()
    const percentage = 25
    const files = formData['file']
    if (Array.isArray(files)) {
        const images = []
        for (const file of files) {
            if (file instanceof File) {
                const fileBuffer = await file.arrayBuffer()
                const fullName = file.name
                const ext = fullName.split('.').pop()
                const path = `${folderPath}/${fullName.split('.')[0]}.${ext}`
                writeFileSync(path, new Uint8Array(fileBuffer))
                images.push(saveImageWithGeneratedThumbnail(file, folderPath, percentage))
            }
        }
        return c.json({
            images,
        })
    } else {
        return c.text('Invalid files', 400)
    }
})

export default {
    port: 10001,
    fetch: app.fetch,
}
