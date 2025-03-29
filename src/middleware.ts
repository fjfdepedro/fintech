import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { validateApiRequest } from '@/lib/utils/security'

// Rate limiting configuration
const RATE_LIMIT = 100 // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds

// Store for rate limiting
const rateLimitStore = new Map<string, { count: number; timestamp: number }>()

// Helper function to check rate limit
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitStore.get(ip)

  if (!userLimit || now - userLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false
  }

  userLimit.count++
  return true
}

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

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

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

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        }
      )
    }

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
    '/api/:path*',
    '/dashboard/:path*',
    '/profile/:path*'
  ]
} 