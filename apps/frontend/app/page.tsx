import Link from "next/link";
import Section from "./_components/Section";
import LandingPageWhiteBoard from "./_components/LandingPageWhiteBoard";
import Testimonial from "./_components/Testimonial";
import { testimonials } from "./_utils/constants";
import MotionComponent from "./_components/MotionComponent";
import Header from "./_components/Header";

function Page() {
  const oddTestimonials = testimonials.filter((_, i) => i % 2 === 1);
  const evenTestimonials = testimonials.filter((_, i) => i % 2 === 0);

  return (
    <>
      <Header />

      <Section divClassName="mt-20 grid min-h-[40rem]  grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-7">
          <h1 className="text-brand-500 text-8xl font-extrabold">
            Unleash Your Creativity
          </h1>
          <p className="text-lg leading-relaxed tracking-wide">
            Collaborate, design, and innovate with ease in a space built for
            creators. Start your journey today and bring your ideas to life.
          </p>
          <Link
            href="/auth/signin"
            className="bg-brand-500 rounded-lg px-4 py-2 text-xl font-medium text-gray-800 shadow-[0_4px_0_0_#000] transition-all duration-300 hover:translate-y-1 hover:shadow-none"
          >
            Start Creating
          </Link>
        </div>

        <LandingPageWhiteBoard />
      </Section>

      <Section divClassName="flex min-h-[20rem]  flex-col gap-3 py-20 scroller">
        <MotionComponent
          className="flex w-fit gap-4"
          animate={{ x: `calc(-50% - 0.5rem)` }}
          transition={{
            duration: 200,
            type: "tween",
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {oddTestimonials.map((testimonial, i) => (
            <Testimonial key={i} {...testimonial} />
          ))}
          {oddTestimonials.map((testimonial, i) => (
            <Testimonial key={i} {...testimonial} />
          ))}
        </MotionComponent>

        <MotionComponent
          className="flex w-fit gap-4 self-end"
          animate={{ x: `calc(50% + 0.5rem)` }}
          transition={{
            duration: 150,
            type: "tween",
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {evenTestimonials.map((testimonial, i) => (
            <Testimonial key={i} {...testimonial} />
          ))}
          {evenTestimonials.map((testimonial, i) => (
            <Testimonial key={i} {...testimonial} />
          ))}
        </MotionComponent>
      </Section>
    </>
  );
}

export default Page;
