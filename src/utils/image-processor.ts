import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { ImageSizeVariant } from '../entities'

interface ProcessOptions {
    width: number
    quality?: number
    fit?: 'inside' | 'cover'
    withoutEnlargement?: boolean
    position?: string
    progressive?: boolean
}

const IMAGE_OPTIONS: Record<keyof ImageSizeVariant | 'placeholder', ProcessOptions> = {
    mobile: { width: 360, quality: 85, fit: 'inside', withoutEnlargement: true, progressive: true },
    tablet: { width: 768, quality: 85, fit: 'inside', withoutEnlargement: true, progressive: true },
    pc: { width: 1920, quality: 90, fit: 'inside', withoutEnlargement: true, progressive: true },
    thumbnail: { width: 150, quality: 80, fit: 'inside', withoutEnlargement: true },
    placeholder: { width: 20, quality: 20, fit: 'inside', withoutEnlargement: true },
    original: { width: 0 },
}

const processVariant = async (
    inputBuffer: Buffer,
    uploadDir: string,
    variant: string,
    options: ProcessOptions,
    uuid: string,
    originalExt?: string,
) => {
    const isOriginal = variant === 'original'
    const extension = isOriginal ? originalExt : 'webp'
    const filename = `${variant}.${extension}`

    let sharpInstance = sharp(inputBuffer)

    if (!isOriginal && options.width) {
        sharpInstance = sharpInstance.resize(options.width, null, {
            withoutEnlargement: options.withoutEnlargement,
            fit: options.fit,
            position: options.position,
        })
    }

    if (!isOriginal) {
        sharpInstance = sharpInstance.webp({
            quality: options.quality,
            effort: options.progressive ? 6 : 4,
        })
    }

    await sharpInstance.toFile(path.join(uploadDir, filename))
    return isOriginal ? `${uuid}_original.${originalExt}` : `${uuid}_${variant}.webp`
}

export const processImage = async (
    inputBuffer: Buffer,
    uuid: string,
    originalExtension: string,
): Promise<ImageSizeVariant & { placeholder?: string }> => {
    const uploadDir = path.join(process.cwd(), 'uploads', uuid)
    await fs.mkdir(uploadDir, { recursive: true })

    const originalExt = originalExtension.toLowerCase().replace('.', '')
    const variants = Object.entries(IMAGE_OPTIONS).filter(([key]) => key !== 'placeholder') as [keyof ImageSizeVariant, ProcessOptions][]

    const results = await Promise.all(
        variants.map(async ([variant, options]) => ({
            variant,
            result: await processVariant(inputBuffer, uploadDir, variant, options, uuid, originalExt),
        })),
    )

    const imageResult = results.reduce((acc, { variant, result }) => {
        acc[variant] = result
        return acc
    }, {} as ImageSizeVariant)

    const placeholderBuffer = await sharp(inputBuffer).resize(20, null, { withoutEnlargement: true }).blur(0.3).webp({ quality: 20 }).toBuffer()

    return {
        ...imageResult,
        placeholder: `data:image/webp;base64,${placeholderBuffer.toString('base64')}`,
    }
}

export const getImagePath = (uuid: string, size: string, extension: string = 'webp'): string => {
    const sanitizedSize = size === 'original' ? 'original' : size
    const ext = size === 'original' ? extension : 'webp'
    return path.join(process.cwd(), 'uploads', uuid, `${sanitizedSize}.${ext}`)
}
