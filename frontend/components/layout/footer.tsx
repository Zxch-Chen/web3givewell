import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-600 to-primary-300 flex items-center justify-center">
                <span className="text-white font-bold">IC</span>
              </div>
              <span className="text-xl font-bold text-primary-600">ImpactChain</span>
            </Link>
            <p className="mt-4 text-sm text-foreground/80 max-w-md">
              Connecting donors, nonprofits, and auditors through blockchain technology to create transparent,
              accountable, and impactful giving.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-foreground/80 hover:text-primary-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-foreground/80 hover:text-primary-600 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-sm text-foreground/80 hover:text-primary-600 transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-foreground/80 hover:text-primary-600 transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-sm text-foreground/80 hover:text-primary-600 transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-sm text-foreground/80">
                <a href="mailto:info@impactchain.org" className="hover:text-primary-600 transition-colors">
                  info@impactchain.org
                </a>
              </li>
              <li className="text-sm text-foreground/80">
                <a
                  href="https://twitter.com/impactchain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li className="text-sm text-foreground/80">
                <a
                  href="https://discord.gg/impactchain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 transition-colors"
                >
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-foreground/60">
            &copy; {new Date().getFullYear()} ImpactChain. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link href="/privacy" className="text-xs text-foreground/60 hover:text-primary-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-foreground/60 hover:text-primary-600 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
