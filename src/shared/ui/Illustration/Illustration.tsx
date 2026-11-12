"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import {
  ErrorScene,
  OfflineScene,
  ResourceScene,
  UnauthorizedScene,
} from "./Scenes";

// The player and each animation load on first use, not with the page bundle.
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const ANIMATIONS = {
  empty: () => import("@/assets/animations/non_data.json"),
  success: () => import("@/assets/animations/successful_login.json"),
} as const;

type AnimatedName = keyof typeof ANIMATIONS;

const SCENES = {
  error: ErrorScene,
  offline: OfflineScene,
  unauthorized: UnauthorizedScene,
  resource: ResourceScene,
} as const;

/** Lottie names, the bundled not-found image, and the drawn static scenes. */
export type IllustrationName = AnimatedName | "notFound" | keyof typeof SCENES;

const isAnimated = (name: IllustrationName): name is AnimatedName =>
  name in ANIMATIONS;

const isScene = (name: IllustrationName): name is keyof typeof SCENES =>
  name in SCENES;

export interface Props {
  name: IllustrationName;
  className?: string;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    // Missing in some old browsers and in jsdom; treat as "no preference".
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Decorative animation (doc 4, doc 6); still frame under prefers-reduced-motion. */
export function Illustration({ name, className }: Props) {
  const [data, setData] = useState<unknown>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!isAnimated(name)) return;
    let active = true;
    ANIMATIONS[name]().then((module) => {
      if (active) setData(module.default);
    });
    return () => {
      active = false;
    };
  }, [name]);

  if (name === "notFound") {
    return (
      <div className={cn("illustration", className)} aria-hidden="true">
        <Image
          src="/images/illustrations/not-fount.svg"
          alt=""
          width={300}
          height={300}
          className="h-full w-full object-contain"
          unoptimized
        />
      </div>
    );
  }

  if (isScene(name)) {
    const Scene = SCENES[name];
    return (
      <div className={cn("illustration", className)} aria-hidden="true">
        <Scene />
      </div>
    );
  }

  return (
    <div className={cn("illustration", className)} aria-hidden="true">
      {data !== null && (
        <Lottie
          animationData={data}
          loop={!reducedMotion}
          autoplay={!reducedMotion}
        />
      )}
    </div>
  );
}
