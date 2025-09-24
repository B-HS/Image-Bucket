export interface FileUploadDto {
    file: File
    uuid?: string
}

export interface FileMetadata {
    id?: number
    uuid: string
    originalName: string
    mimeType: string
    size: number
    createdAt: Date
}
