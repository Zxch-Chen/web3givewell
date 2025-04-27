import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageLayout } from "@/components/layout/page-layout"

export default function Home() {
  return (
    <PageLayout>
      <section className="relative web3-bg">
        {/* Background with reactive animation */}
        <div className="absolute inset-0 reactive-bg" />
        <div className="absolute inset-0 hexagon-grid" />
        <div className="absolute inset-0 blockchain-nodes" />

        {/* Hero Section */}
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-800 via-primary-600 to-primary-400 bg-clip-text text-transparent animate-gradient-x">
              Transparent Impact Through Blockchain
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 mb-8">
              ImpactChain connects donors, nonprofits, and auditors through blockchain technology to create transparent,
              accountable, and impactful giving.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full sm:w-auto floating shadow-lg shadow-primary-500/20"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="w-full sm:w-auto gradient-border hover:shadow-md">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-r from-green-50 via-white to-green-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md reactive-card hover:bg-gradient-to-br hover:from-white hover:to-green-50">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4 green-pulse">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-primary-700">NPOs Create Milestones</h3>
              <p className="text-foreground/80">
                Nonprofits define clear, measurable milestones for their projects and request funding.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md reactive-card hover:bg-gradient-to-br hover:from-white hover:to-green-50">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4 green-pulse">
                <span className="text-primary-600 font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-primary-700">Donors Fund Milestones</h3>
              <p className="text-foreground/80">
                Donors browse milestones and contribute directly to those that align with their values.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md reactive-card hover:bg-gradient-to-br hover:from-white hover:to-green-50">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4 green-pulse">
                <span className="text-primary-600 font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-primary-700">Auditors Verify Impact</h3>
              <p className="text-foreground/80">
                Independent auditors verify milestone completion before funds are released.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose ImpactChain</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex flex-col space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Full Transparency</h3>
                  <p className="text-foreground/80">
                    All transactions and milestone verifications are recorded on the blockchain for complete
                    transparency.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Secure Funding</h3>
                  <p className="text-foreground/80">
                    Smart contracts ensure funds are only released when milestones are verified by independent auditors.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Measurable Impact</h3>
                  <p className="text-foreground/80">
                    Track the real-world impact of your donations with verifiable evidence and progress updates.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Community Governance</h3>
                  <p className="text-foreground/80">
                    Stakeholders can participate in governance decisions to ensure the platform evolves to meet
                    community needs.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Simplified Reporting</h3>
                  <p className="text-foreground/80">
                    Automated reporting tools make it easy for nonprofits to share progress and for donors to track
                    their impact.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Global Reach</h3>
                  <p className="text-foreground/80">
                    Connect with nonprofits and donors worldwide, breaking down geographical barriers to impact.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 text-white relative overflow-hidden web3-bg">
        <div className="absolute inset-0 hexagon-grid opacity-20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20 animate-[pulse_15s_ease-in-out_infinite]"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold mb-6">Ready to Make an Impact?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Join ImpactChain today and be part of a transparent, accountable, and impactful giving ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                variant="default"
                size="lg"
                className="bg-white text-primary-600 hover:bg-gray-100 w-full sm:w-auto shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                Sign Up Now
              </Button>
            </Link>
            <Link href="/projects">
              <Button
                variant="default"
                size="lg"
                className="bg-white text-primary-600 hover:bg-gray-100 w-full sm:w-auto shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                Browse Projects
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
