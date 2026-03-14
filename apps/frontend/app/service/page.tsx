import Link from "next/link";

function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold">Terms of Service</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">1. Acceptance of Terms</h2>
        <p className="leading-relaxed text-gray-600">
          By accessing or using PixelSync, you agree to be bound by these Terms
          of Service. If you do not agree, you may not use the platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">2. Use of the Service</h2>
        <p className="leading-relaxed text-gray-600">
          You may use PixelSync for lawful purposes only. You are responsible for
          all content you create and share through the platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">3. Accounts</h2>
        <p className="leading-relaxed text-gray-600">
          You are responsible for maintaining the security of your account
          credentials. Notify us immediately of any unauthorized access.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">4. Intellectual Property</h2>
        <p className="leading-relaxed text-gray-600">
          Content you create on PixelSync remains yours. By using the service,
          you grant us a limited license to host and display your content as
          necessary to operate the platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">
          5. Limitation of Liability
        </h2>
        <p className="leading-relaxed text-gray-600">
          PixelSync is provided &quot;as is&quot; without warranties of any kind. We are
          not liable for any damages arising from your use of the service.
        </p>
      </section>

      <Link href="/" className="text-brand-500 hover:underline">
        &larr; Back to home
      </Link>
    </main>
  );
}

export default Page;
