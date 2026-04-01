import path from 'path';

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp'
};

export function getMimeType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'image/jpeg';
}

export const TOOL_NAME = 'understand_image';
