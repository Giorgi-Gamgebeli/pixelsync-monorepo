"use client";

import { useEffect } from "react";
import { layerAnimation } from "../_animations/authAnimation";
import { useAnimate } from "framer-motion";
import MotionComponent from "@/app/_components/MotionComponent";
import VideoPlayer from "./VideoPlayer";
import { staggerChildVariants } from "../_animations/smallAnimations";

function AuthRightSide() {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    layerAnimation(animate);
  }, [animate]);

  const reasons = [
    "Simpler user interface ✨",
    "All-in-one tool 🚀",
    "Real-time collab 🤝",
    "Secure and reliable 🔒",
    "Easy to use 🛠️",
    "Seamless task management 📅",
  ];

  return (
    <aside
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white"
      ref={scope}
    >
      <MotionComponent
        className="bg-brand-500 grid h-20 w-20 grid-rows-[auto_1fr] rounded-full"
        initial={{ y: -500 }}
        id="secondLayer"
      >
        <div className="absolute z-10">
          <MotionComponent
            className="h-24 w-[300rem] -rotate-45 bg-gray-900"
            id="line1"
          />
          <MotionComponent
            className="h-24 w-[300rem] -rotate-45 bg-gray-900"
            id="line2"
          />
          <MotionComponent
            className="h-24 w-[300rem] -rotate-45 bg-gray-900"
            id="line3"
          />
        </div>
        <div className="absolute top-25 -left-10 z-20 w-80 -rotate-45 overflow-hidden">
          <MotionComponent
            className="hidden h-full w-full translate-x-[100%] items-center gap-80"
            id="headingSlider"
          >
            <h2 className="flex min-w-full justify-end text-3xl font-medium text-white">
              SKETCH IT OUT
            </h2>
            <h2 className="flex min-w-full justify-end text-3xl font-medium text-white">
              USER FLOW
            </h2>
            <h2 className="flex min-w-full justify-end text-3xl font-medium text-white">
              DESIGN
            </h2>
          </MotionComponent>
        </div>
        <div>
          <MotionComponent
            className="hidden w-full translate-x-[100%]"
            id="videoSlider"
          >
            <VideoPlayer
              id="video1"
              videoURL="https://pgqopytnbkjovvnwtvun.supabase.co/storage/v1/object/public/pixelsync-bucket//sketchItOut.mp4"
            />

            <VideoPlayer
              id="video2"
              videoURL="https://pgqopytnbkjovvnwtvun.supabase.co/storage/v1/object/public/pixelsync-bucket//userFlow.mp4"
            />

            <VideoPlayer
              id="video3"
              videoURL="https://pgqopytnbkjovvnwtvun.supabase.co/storage/v1/object/public/pixelsync-bucket//design.mp4"
            />
          </MotionComponent>
        </div>
        <div className="flex items-center justify-center overflow-hidden">
          <MotionComponent
            className="hidden h-20 w-20 flex-col items-center rounded-full bg-white p-10"
            id="thirdLayer"
            initial={{ y: 500 }}
          >
            <MotionComponent
              className="grid h-full grid-cols-2 gap-10"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: 0.2,
                    delayChildren: 7,
                  },
                },
              }}
            >
              <MotionComponent
                as="h1"
                className="col-start-1 col-end-3 text-center text-[2.5rem]"
                variants={staggerChildVariants()}
              >
                Why choose us? 🤔
              </MotionComponent>
              {reasons.map((reason, i) => (
                <MotionComponent
                  as="p"
                  variants={staggerChildVariants()}
                  className="text-2xl"
                  key={i}
                >
                  {reason}
                </MotionComponent>
              ))}
            </MotionComponent>
          </MotionComponent>
        </div>
      </MotionComponent>
    </aside>
  );
}

export default AuthRightSide;
