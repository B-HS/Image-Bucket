import { readFileSync, writeFileSync } from 'fs'
import { Hono } from 'hono'
import { env } from 'hono/adapter'
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
            const width = info.width && Math.min(800, info.width)
            return sharp(fileBuffer).resize(width).webp({ quality: 80 }).toBuffer()
        })
        .then((output) => writeFileSync(`${folderPath}/${fileName}.webp`, new Uint8Array(output)))

    await sharp(fileBuffer)
        .metadata()
        .then((info) => {
            const width = info.width && Math.round((info.width * percentage) / 100)
            const height = info.height && Math.round((info.height * percentage) / 100)
            return sharp(fileBuffer).resize(width, height).webp({ quality: 80 }).toBuffer()
        })
        .then((output) => writeFileSync(`${folderPath}/${fileName}-thumbnail.webp`, new Uint8Array(output)))

    const responseData = { path: `${fileName}.webp`, thumbnail: `${folderPath}/${fileName}-thumbnail.webp` }
    return responseData
}

app.get('/:imagename', async (c) => {
    try {
        const Env = env(c)
        const folderPath = (Env.folder_path as string) || '/Desktop'
        const imagename = c.req.param('imagename')
        const isThumbnail = c.req.query('thumbnail')
        const path = isThumbnail ? `${folderPath}/${imagename.split('.')[0]}-thumbnail.webp` : `${folderPath}/${imagename}`
        const image = readFileSync(path)

        if (!image) {
            return c.text('Image not found', 404)
        }

        return stream(c, async (stream) => {
            await stream.write(new Uint8Array(image)).then(() => stream.close())
        })
    } catch (error) {
        console.log(error)
        return c.text('Failed to request', 500)
    }
})

app.post('/image/upload', async (c) => {
    try {
        const Env = env(c)
        const folderPath = (Env.folder_path as string) || '/Desktop'
        const formData = await c.req.parseBody()
        const percentage = 35
        const files = formData['file']
        const fileList = Array.isArray(files) ? files : [files]

        const images = []
        for (const file of fileList) {
            if (file instanceof File) {
                const fileBuffer = await file.arrayBuffer()
                const fullName = file.name
                const ext = fullName.split('.').pop()
                const path = `${folderPath}/${fullName.split('.')[0]}.${ext}`
                writeFileSync(path, new Uint8Array(fileBuffer))
                images.push(await saveImageWithGeneratedThumbnail(file, folderPath, percentage))
            }
        }
        return c.json({
            images,
        })
    } catch (error) {
        console.log(error)
        return c.text('Failed to request', 500)
    }
})

export default {
    port: 20002,
    fetch: app.fetch,
}
