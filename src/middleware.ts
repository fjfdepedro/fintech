import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { validateApiRequest } from '@/lib/utils/security'

// Configuración del rate limiting
const RATE_LIMIT_REQUESTS = Number(process.env.RATE_LIMIT_REQUESTS) || 100
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000

// Mapa para almacenar las solicitudes por IP
const ipRequests = new Map<string, { count: number; resetTime: number }>()

// List of protected API routes that require authentication
const protectedRoutes = [
  '/api/market',
  '/api/limits'
]

// List of public API routes that only need origin validation and rate limiting
const publicApiRoutes = [
  '/api/crypto',
  '/api/crypto/history',
  '/api/crypto/last-update',
  '/api/crypto/update',
  '/api/dashboard',
  '/api/articles'
]

// List of cron job routes that require CRON_SECRET
const cronRoutes = [
  '/api/cron/update-crypto',
  '/api/cron/update-article',
  '/api/revalidate'
]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Ignorar archivos estáticos
  if (path.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js)$/)) {
    return NextResponse.next()
  }

  // Check if it's a cron route
  if (cronRoutes.some(route => path.startsWith(route))) {
    const authHeader = request.headers.get('Authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!authHeader || !cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // Check if it's an API route
  if (path.startsWith('/api/')) {
    // Check if the route is either public or protected
    const isPublicRoute = publicApiRoutes.some(route => path.startsWith(route))
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

    // If it's neither public nor protected, deny access
    if (!isPublicRoute && !isProtectedRoute) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      )
    }

    // Validate API request origin and referer
    if (!validateApiRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid origin' },
        { status: 403 }
      )
    }

    // Get the client's IP
    const ip = request.ip ?? '127.0.0.1'
    const now = Date.now()

    // Limpiar entradas antiguas
    for (const [key, value] of ipRequests.entries()) {
      if (now > value.resetTime) {
        ipRequests.delete(key)
      }
    }

    // Obtener o crear el registro de la IP
    const ipData = ipRequests.get(ip) ?? {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    }

    // Verificar si se ha excedido el límite
    if (ipData.count >= RATE_LIMIT_REQUESTS) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Please try again later'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((ipData.resetTime - now) / 1000))
          }
        }
      )
    }

    // Incrementar el contador
    ipData.count++
    ipRequests.set(ip, ipData)

    // For protected API routes that require authentication
    if (isProtectedRoute) {
      const token = await getToken({ req: request })
      
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        )
      }
    }

    // Add security headers to all API responses
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }

    return response
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/',  // Add home page
    '/api/:path*',
    '/dashboard/:path*',
    '/profile/:path*'
  ]
} 