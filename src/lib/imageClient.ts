// Browser-only helper: shrink a photo before uploading so phone pictures
// (often 5–10MB) go up quickly. The server re-encodes anyway.
export async function compressImage(
  file: File,
  maxEdge = 1800
): Promise<{ base64: string; type: string; dataUrl: string }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
  return { base64: dataUrl.split(',')[1], type: 'image/jpeg', dataUrl }
}
