import { promises as fs } from 'fs'
import path from 'path'
import { ImageMetadata, ImageSizeVariant } from '../../entities'
import { generateUUID, processImage, getImagePath } from '../../utils'
import { saveImageMetadata, listImages } from '../../db'

export const uploadImage = async (file: File | Blob, originalName: string): Promise<{ uuid: string; sizes: ImageSizeVariant }> => {
    const buffer = Buffer.from(await file.arrayBuffer())
    const uuid = generateUUID()
    const extension = path.extname(originalName)

    const sizes = await processImage(buffer, uuid, extension)

    await saveImageMetadata({
        uuid,
        originalName,
        mimeType: file.type || 'image/webp',
        size: buffer.length,
    })

    return { uuid, sizes }
}

export const getImage = async (filename: string): Promise<{ buffer: Buffer; mimeType: string } | null> => {
    try {
        const match = filename.match(/^([a-f0-9-]+)_(mobile|tablet|pc|thumbnail|original)\.(\w+)$/)
        if (!match) return null

        const [, uuid, size, extension] = match
        const imagePath = getImagePath(uuid, size, extension)

        const buffer = await fs.readFile(imagePath)
        const mimeType = size === 'original' ? `image/${extension}` : 'image/webp'

        return { buffer, mimeType }
    } catch (error) {
        console.error('Error reading image:', error)
        return null
    }
}

export const getImagesList = (): ImageMetadata[] => {
    return listImages()
}
