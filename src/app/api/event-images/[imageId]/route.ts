import { prisma } from '@/lib/prisma'

// GET /api/event-images/[imageId] — public; images never change once uploaded
// (a new upload gets a new id), so browsers and CDNs can cache them forever.
export async function GET(_req: Request, { params }: { params: { imageId: string } }) {
  if (!/^[a-z0-9]{20,40}$/i.test(params.imageId)) {
    return new Response('Not found', { status: 404 })
  }
  const image = await prisma.eventImage.findUnique({
    where: { id: params.imageId },
    select: { data: true, contentType: true },
  })
  if (!image) return new Response('Not found', { status: 404 })

  return new Response(new Uint8Array(image.data), {
    headers: {
      'Content-Type': image.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
