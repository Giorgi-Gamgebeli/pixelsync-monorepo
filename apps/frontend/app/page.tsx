import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import logo from "../public/noBGLogo.png";
import FeatureCard from "./_components/FeatureCard";
import Header from "./_components/Header";
import ShowcaseItem from "./_components/ShowcaseItem";
import { features } from "./_utils/constants";
import CurrentYear from "./_components/CurrentYear";

function Page() {
  return (
    <div className="bg-primary">
      <Header />

      {/* Hero Section */}
      <section className="flex min-h-screen items-center pt-16">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-6">
            <h1 className="text-5xl leading-tight font-bold tracking-tight text-white lg:text-6xl">
              Design Together,
              <br />
              <span className="text-brand-400">Talk Together</span>
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-gray-400">
              The collaborative whiteboard where your team actually hangs out.
              Draw, design, and discuss - all in one place, in real time.
            </p>
            <div className="flex gap-4">
              <Link
                href="/auth/signup"
                className="bg-brand-500 hover:bg-brand-600 inline-flex items-center rounded-lg px-6 py-3 text-base font-medium text-white transition-colors"
              >
                Get Started - It&apos;s Free
              </Link>
            </div>
          </div>

          {/* Product Screenshot Mockup */}
          <div className="flex items-center justify-center">
            <div className="border-border bg-secondary shadow-brand-500/5 w-full overflow-hidden rounded-xl border shadow-2xl">
              {/* Browser chrome */}
              <div className="border-border bg-surface flex items-center gap-2 border-b px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-400/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <div className="h-3 w-3 rounded-full bg-green-400/80" />
                <div className="bg-primary/50 ml-4 h-6 flex-1 rounded" />
              </div>
              {/* App mockup */}
              <div className="flex h-80 lg:h-96">
                {/* Mini sidebar */}
                <div className="border-border bg-sidebar flex w-12 flex-col items-center gap-2 border-r py-3">
                  <div className="bg-brand-500/20 h-8 w-8 rounded-lg" />
                  <div className="border-border my-1 w-6 border-b" />
                  <div className="bg-surface h-8 w-8 rounded-lg" />
                  <div className="bg-surface h-8 w-8 rounded-lg" />
                </div>
                {/* Room sidebar */}
                <div className="border-border bg-sidebar flex w-40 flex-col border-r p-3">
                  <p className="mb-2 text-xs font-semibold text-gray-500">
                    Rooms
                  </p>
                  <div className="bg-brand-500/10 mb-1 rounded-md px-2 py-1.5">
                    <p className="text-brand-400 text-xs font-medium">
                      Wireframes
                    </p>
                  </div>
                  <div className="mb-1 rounded-md px-2 py-1.5">
                    <p className="text-xs text-gray-500">Logo Ideas</p>
                  </div>
                  <div className="rounded-md px-2 py-1.5">
                    <p className="text-xs text-gray-500">Architecture</p>
                  </div>
                  <p className="mt-4 mb-2 text-xs font-semibold text-gray-500">
                    Members
                  </p>
                  <div className="flex items-center gap-1.5 py-1">
                    <div className="relative h-5 w-5 rounded-full bg-blue-500/30">
                      <div className="border-sidebar absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border bg-green-500" />
                    </div>
                    <p className="text-xs text-gray-400">alex</p>
                  </div>
                  <div className="flex items-center gap-1.5 py-1">
                    <div className="relative h-5 w-5 rounded-full bg-purple-500/30">
                      <div className="border-sidebar absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border bg-green-500" />
                    </div>
                    <p className="text-xs text-gray-400">niko</p>
                  </div>
                </div>
                {/* Canvas area */}
                <div className="bg-secondary relative flex-1 p-4">
                  <div className="bg-brand-500/10 border-brand-500/30 absolute top-8 left-8 h-16 w-24 rounded border" />
                  <div className="absolute top-12 left-40 h-20 w-32 rounded border border-blue-500/30 bg-blue-500/10" />
                  <div className="border-border bg-surface absolute top-36 left-20 h-12 w-40 rounded border" />
                  {/* Cursor 1 */}
                  <div className="absolute top-16 left-52 flex items-start gap-1">
                    <svg
                      width="12"
                      height="16"
                      viewBox="0 0 12 16"
                      className="text-blue-400"
                    >
                      <path d="M0 0L12 9H5L3 16L0 0Z" fill="currentColor" />
                    </svg>
                    <span className="rounded bg-blue-500 px-1.5 py-0.5 text-[10px] text-white">
                      alex
                    </span>
                  </div>
                  {/* Cursor 2 */}
                  <div className="absolute top-40 left-48 flex items-start gap-1">
                    <svg
                      width="12"
                      height="16"
                      viewBox="0 0 12 16"
                      className="text-purple-400"
                    >
                      <path d="M0 0L12 9H5L3 16L0 0Z" fill="currentColor" />
                    </svg>
                    <span className="rounded bg-purple-500 px-1.5 py-0.5 text-[10px] text-white">
                      niko
                    </span>
                  </div>
                </div>
                {/* Chat panel */}
                <div className="border-border bg-sidebar flex w-44 flex-col border-l">
                  <div className="border-border border-b px-3 py-2">
                    <p className="text-xs font-semibold text-gray-300">Chat</p>
                  </div>
                  <div className="flex flex-1 flex-col justify-end gap-2 p-2">
                    <div>
                      <p className="text-[10px] font-medium text-blue-400">
                        alex
                      </p>
                      <p className="text-[10px] text-gray-400">
                        what about the header?
                      </p>
                    </div>
                    <div>
                      <p className="text-brand-400 text-[10px] font-medium">
                        you
                      </p>
                      <p className="text-[10px] text-gray-400">
                        lets make it bolder
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-purple-400">
                        niko
                      </p>
                      <p className="text-[10px] text-gray-400">+1</p>
                    </div>
                  </div>
                  <div className="border-border border-t p-2">
                    <div className="bg-surface h-5 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-white">
              Everything your team needs in one place
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              No more switching between tabs. Design, communicate, and
              collaborate - together.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-white">See it in action</h2>
            <p className="mt-4 text-lg text-gray-400">
              A canvas where everyone draws, a chat where everyone talks, and
              presence that keeps your team connected.
            </p>
          </div>

          <div className="border-border bg-surface overflow-hidden rounded-2xl border shadow-xl">
            <div className="p-8 lg:p-12">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <ShowcaseItem
                  icon="mdi:cursor-default-click"
                  title="Live Cursors"
                  description="See exactly where your teammates are working on the canvas in real time."
                />
                <ShowcaseItem
                  icon="mdi:message-text"
                  title="Room Chat"
                  description="Every room has its own chat. Discuss what you're designing, right where you're designing it."
                />
                <ShowcaseItem
                  icon="mdi:account-circle"
                  title="Presence"
                  description="Know who's online, who's in which room, and jump in to collaborate."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-500 py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to design together?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-white/80">
            Join teams who are already collaborating on PixelSync. Free to get
            started.
          </p>
          <Link
            href="/auth/signup"
            className="mt-8 inline-flex items-center rounded-lg bg-white px-8 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-gray-100"
          >
            Get Started - It&apos;s Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border bg-secondary border-t py-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Image
              src={logo}
              alt="PixelSync logo"
              height={32}
              width={32}
              className="rounded-full"
            />
            <span className="text-sm font-medium text-gray-300">PixelSync</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-gray-500 hover:text-gray-300"
            >
              Privacy
            </Link>
            <Link
              href="/service"
              className="text-sm text-gray-500 hover:text-gray-300"
            >
              Terms
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            &copy;{" "}
            <Suspense>
              <CurrentYear />
            </Suspense>{" "}
            PixelSync
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Page;
