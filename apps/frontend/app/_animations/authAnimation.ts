"use client";

type Animate = typeof import("framer-motion").animate;

export async function layerAnimation(animate: Animate) {
  await animate(
    "#secondLayer",
    { y: 0 },
    {
      duration: 0.5,
      ease: "easeInOut",
    },
  );

  animate(
    "#secondLayer",
    { scaleY: 0.6, scaleX: 1.4 },
    {
      duration: 0.1,
      stiffness: 200,
      type: "spring",
    },
  );

  await animate(
    "#secondLayer",
    { y: -300, scaleY: 1.2, scaleX: 0.8 },
    {
      duration: 0.6,
      ease: "easeInOut",
    },
  );

  animate(
    "#secondLayer",
    { scaleY: 1, scaleX: 1 },
    {
      duration: 0.1,
      stiffness: 200,
      type: "spring",
    },
  );

  await animate(
    "#secondLayer",
    { y: 0 },
    {
      duration: 1,
      ease: "easeInOut",
    },
  );

  animate(
    "#secondLayer",
    { scaleY: 0.8, scaleX: 1.2 },
    {
      duration: 0.1,
      stiffness: 200,
      type: "spring",
    },
  );

  await animate(
    "#secondLayer",
    { y: 0 },
    {
      duration: 0.5,
      ease: "easeInOut",
    },
  );

  animate(
    "#secondLayer",
    { scaleY: 0.6, scaleX: 1.4 },
    {
      duration: 0.1,
      stiffness: 200,
      type: "spring",
    },
  );

  await animate(
    "#secondLayer",
    { y: -200, scaleY: 1.2, scaleX: 0.8 },
    {
      duration: 0.6,
      ease: "easeInOut",
    },
  );

  animate(
    "#secondLayer",
    { scaleY: 1, scaleX: 1 },
    {
      duration: 0.1,
      stiffness: 200,
      type: "spring",
    },
  );

  await animate(
    "#secondLayer",
    { y: 0 },
    {
      duration: 1,
      ease: "easeInOut",
    },
  );

  await animate(
    "#secondLayer",
    { scale: 20 },
    {
      duration: 0.5,
    },
  );

  animate(
    "#secondLayer",
    { scale: 1, height: "100%", width: "100%", borderRadius: 0 },
    {
      duration: 0,
    },
  );
  animate("#line1", { x: -1710, y: -1710 }, { duration: 0.5 });
  animate("#line2", { x: -1710, y: -1710 }, { duration: 0.5, delay: 0.1 });
  await animate(
    "#line3",
    { x: -1710, y: -1710 },
    { duration: 0.5, delay: 0.2 },
  );

  slowSliderHeading(animate);
  slowSliderImages(animate);

  await animate("#thirdLayer", { y: 0, display: "flex" }, { duration: 0.5 });

  await animate(
    "#thirdLayer",
    { scale: 20 },
    {
      duration: 0.5,
    },
  );

  animate(
    "#thirdLayer",
    { scale: 1, height: "100%", width: "100%", borderRadius: 0 },
    {
      duration: 0,
    },
  );
}

async function slowSliderHeading(animate: Animate) {
  animate("#headingSlider", { display: "flex" }, { duration: 0 });
  await animate(
    "#headingSlider",
    { x: "-100%" },
    { duration: 0.5, delay: 0.5 },
  );
  await animate(
    "#headingSlider",
    { x: "-130%" },
    { duration: 5, ease: "linear" },
  );
  await animate("#headingSlider", { x: "-300%" }, { duration: 0.5 });
  await animate(
    "#headingSlider",
    { x: "-340%" },
    { duration: 5, ease: "linear" },
  );
  await animate("#headingSlider", { x: "-530%" }, { duration: 0.5 });
}

async function slowSliderImages(animate: Animate) {
  animate("#videoSlider", { display: "flex" }, { duration: 0 });
  await animate("#videoSlider", { x: "-100%" }, { duration: 0.2, delay: 0.5 });
  await animate(
    "#video1",
    { rotate: 45, scale: 0.001 },
    { duration: 0.2, delay: 5.1, ease: "linear" },
  );

  await animate("#videoSlider", { x: "-200%" }, { duration: 0.2 });
  await animate(
    "#video2",
    { rotate: 45, scale: 0.001 },
    { duration: 0.2, delay: 5.1, ease: "linear" },
  );

  await animate(
    "#videoSlider",
    { x: "-300%" },
    { duration: 0.2, ease: "linear" },
  );
}
