import Link from 'next/link'

export function Header() {
  return (
    <div className="flex items-center mb-6">
      <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8"
          aria-hidden="true"
        >
          <path d="M12 2v20M2 12h20M7 17l5-5 5 5M7 7l5 5 5-5" />
        </svg>
        <h1 className="font-bold text-2xl">
          Crypto Market Insights
        </h1>
      </Link>
    </div>
  )
} 