'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-6 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{' '}
            <a
              href="https://github.com/fjfdepedro"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              fjfdepedro
            </a>
            . The source code is available on{' '}
            <a
              href="https://github.com/fjfdepedro/fintech"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
        </div>
        <nav className="flex items-center justify-center space-x-4 md:justify-end">
          <Link
            href="/terms-of-service"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Terms
          </Link>
          <Link
            href="/privacy-policy"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Privacy
          </Link>
          <Link
            href="/legal"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Legal
          </Link>
        </nav>
      </div>
    </footer>
  )
} 