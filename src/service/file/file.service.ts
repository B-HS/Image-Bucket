import { promises as fs } from 'fs'
import path from 'path'
import { FileMetadata } from '../../entities'
import { generateUUID } from '../../utils'
import { saveFileMetadata, getFileMetadata, listFiles } from '../../db'

export const uploadFile = async (file: File | Blob, originalName: string): Promise<{ uuid: string }> => {
    const buffer = Buffer.from(await file.arrayBuffer())
    const uuid = generateUUID()
    const extension = path.extname(originalName)

    const uploadDir = path.join(process.cwd(), 'uploads', uuid)
    await fs.mkdir(uploadDir, { recursive: true })

    const filename = `file${extension}`
    await fs.writeFile(path.join(uploadDir, filename), buffer)

    await saveFileMetadata({
        uuid,
        originalName,
        mimeType: file.type || 'application/octet-stream',
        size: buffer.length,
    })

    return { uuid }
}

export const getFile = async (uuid: string): Promise<{ buffer: Buffer; metadata: FileMetadata } | null> => {
    try {
        const metadata = getFileMetadata(uuid)
        if (!metadata) return null

        const extension = path.extname(metadata.originalName)
        const filePath = path.join(process.cwd(), 'uploads', uuid, `file${extension}`)

        const buffer = await fs.readFile(filePath)

        return { buffer, metadata }
    } catch (error) {
        console.error('Error reading file:', error)
        return null
    }
}

export const getFilesList = (): FileMetadata[] => {
    return listFiles()
}
