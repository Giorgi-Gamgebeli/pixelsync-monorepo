import Link from "next/link";

function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">1. Information We Collect</h2>
        <p className="leading-relaxed text-gray-600">
          We collect information you provide when creating an account, such as
          your email address and username. We also collect usage data to improve
          our services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">2. How We Use Your Data</h2>
        <p className="leading-relaxed text-gray-600">
          Your data is used to provide and improve PixelSync&apos;s collaborative
          features, authenticate your identity, and communicate important service
          updates.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">3. Data Sharing</h2>
        <p className="leading-relaxed text-gray-600">
          We do not sell your personal data. Information may be shared with
          third-party services only as necessary to operate the platform (e.g.,
          hosting, authentication).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">4. Data Security</h2>
        <p className="leading-relaxed text-gray-600">
          We implement industry-standard security measures to protect your data.
          However, no method of transmission over the internet is 100% secure.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">5. Contact Us</h2>
        <p className="leading-relaxed text-gray-600">
          If you have questions about this privacy policy, please reach out to
          our team.
        </p>
      </section>

      <Link href="/" className="text-brand-500 hover:underline">
        &larr; Back to home
      </Link>
    </main>
  );
}

export default Page;
