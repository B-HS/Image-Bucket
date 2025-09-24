import { Database } from 'bun:sqlite'
import { ImageMetadata, FileMetadata } from '../entities'

export const initDatabase = () => {
    const db = new Database('bimage.db')

    db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

    db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

    db.run(`CREATE INDEX IF NOT EXISTS idx_images_uuid ON images(uuid)`)
    db.run(`CREATE INDEX IF NOT EXISTS idx_files_uuid ON files(uuid)`)

    return db
}

export const db = initDatabase()

export const saveImageMetadata = async (metadata: Omit<ImageMetadata, 'id' | 'createdAt'>) => {
    setImmediate(() => {
        const stmt = db.prepare(`
      INSERT INTO images (uuid, original_name, mime_type, size)
      VALUES ($uuid, $originalName, $mimeType, $size)
    `)

        stmt.run({
            $uuid: metadata.uuid,
            $originalName: metadata.originalName,
            $mimeType: metadata.mimeType,
            $size: metadata.size,
        })
    })
}

export const saveFileMetadata = async (metadata: Omit<FileMetadata, 'id' | 'createdAt'>) => {
    setImmediate(() => {
        const stmt = db.prepare(`
      INSERT INTO files (uuid, original_name, mime_type, size)
      VALUES ($uuid, $originalName, $mimeType, $size)
    `)

        stmt.run({
            $uuid: metadata.uuid,
            $originalName: metadata.originalName,
            $mimeType: metadata.mimeType,
            $size: metadata.size,
        })
    })
}

export const getImageMetadata = (uuid: string): ImageMetadata | null => {
    const stmt = db.prepare<ImageMetadata, { $uuid: string }>(`
    SELECT id, uuid, original_name as originalName, mime_type as mimeType, size, created_at as createdAt
    FROM images
    WHERE uuid = $uuid
  `)

    return stmt.get({ $uuid: uuid })
}

export const getFileMetadata = (uuid: string): FileMetadata | null => {
    const stmt = db.prepare<FileMetadata, { $uuid: string }>(`
    SELECT id, uuid, original_name as originalName, mime_type as mimeType, size, created_at as createdAt
    FROM files
    WHERE uuid = $uuid
  `)

    return stmt.get({ $uuid: uuid })
}

export const listImages = (): ImageMetadata[] => {
    const stmt = db.prepare<ImageMetadata, {}>(`
    SELECT id, uuid, original_name as originalName, mime_type as mimeType, size, created_at as createdAt
    FROM images
    ORDER BY created_at DESC
  `)

    return stmt.all({})
}

export const listFiles = (): FileMetadata[] => {
    const stmt = db.prepare<FileMetadata, {}>(`
    SELECT id, uuid, original_name as originalName, mime_type as mimeType, size, created_at as createdAt
    FROM files
    ORDER BY created_at DESC
  `)

    return stmt.all({})
}
