export interface ImageUploadDto {
    file: File
    uuid?: string
}

export interface ImageMetadata {
    id?: number
    uuid: string
    originalName: string
    mimeType: string
    size: number
    createdAt: Date
}

export interface ImageSizeVariant {
    mobile: string
    tablet: string
    pc: string
    original: string
    thumbnail: string
}

export interface ImageProcessOptions {
    mobile: { width: 360 }
    tablet: { width: 768 }
    pc: { width: 1920 }
    thumbnail: { width: 150 }
}

export type ImageSize = keyof ImageSizeVariant
