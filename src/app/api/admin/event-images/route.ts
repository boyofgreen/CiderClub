import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import sharp from 'sharp'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Base64 of an ~8MB original. The admin page shrinks images before upload,
// so real uploads are far smaller; this just stops anything absurd.
const MAX_BASE64 = 11_000_000
const MAX_EDGE = 1800

// POST /api/admin/event-images — { imageBase64 } → { url }
// Re-encodes every upload to WebP: caps the size, strips EXIF (including phone
// GPS location), and ensures what we serve is really an image.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { imageBase64 } = await req.json().catch(() => ({}))
  if (typeof imageBase64 !== 'string' || !imageBase64) {
    return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 })
  }
  if (imageBase64.length > MAX_BASE64) {
    return NextResponse.json({ error: 'That image is too large — try one under 8MB.' }, { status: 413 })
  }

  let output: { data: Buffer; info: sharp.OutputInfo }
  try {
    output = await sharp(Buffer.from(imageBase64, 'base64'), { limitInputPixels: 50_000_000 })
      .rotate() // honor the phone's orientation before EXIF is dropped
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true })
  } catch {
    return NextResponse.json({ error: "That file isn't an image we can read. Try a JPEG or PNG." }, { status: 422 })
  }

  const image = await prisma.eventImage.create({
    data: {
      data: output.data,
      contentType: 'image/webp',
      width: output.info.width,
      height: output.info.height,
    },
    select: { id: true },
  })

  return NextResponse.json({ url: `/api/event-images/${image.id}` }, { status: 201 })
}
