"use client";

import Image from "next/image";
import { Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { IMAGES } from "@/shared/config/assets";

import "swiper/css";
import "swiper/css/effect-fade";

const slides = [IMAGES.heroOne, IMAGES.heroTwo, IMAGES.heroThree];

/** Fading image slider with the gradient overlay; purely decorative. */
export default function HeroBackground() {
  return (
    <>
      {/* Swiper's own CSS sets `.swiper { position: relative }` outside any
          layer, which beats a Tailwind `absolute`; the wrapper holds the box. */}
      <div className="absolute inset-0 z-0">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          speed={1500}
          loop
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          className="hero_swiper h-full w-full [&_.swiper-slide]:h-full [&_.swiper-slide]:w-full [&_.swiper-wrapper]:h-full [&_.swiper-wrapper]:w-full"
        >
          {slides.map((image, index) => (
            <SwiperSlide key={image.src}>
              <div className="hero_slide relative h-full w-full bg-cover bg-center bg-no-repeat before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(30,30,30,0.62)_0%,rgba(30,30,30,0.16)_42%,rgba(30,30,30,0.58)_100%),linear-gradient(90deg,rgba(10,37,64,0.28),transparent_58%)] before:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_35%)] after:mix-blend-screen after:content-['']">
                <Image
                  src={image}
                  alt=""
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  style={{ objectFit: "cover", objectPosition: "center" }}
                  className="animate-[hero-image-drift_14s_ease-in-out_infinite_alternate] motion-reduce:animate-none"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div
        className="hero_overlay pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(10,37,64,0.64)_0%,rgba(10,37,64,0.12)_38%,rgba(30,30,30,0.58)_100%),linear-gradient(90deg,rgba(10,37,64,0.38),transparent_58%)]"
        aria-hidden="true"
      />
    </>
  );
}
