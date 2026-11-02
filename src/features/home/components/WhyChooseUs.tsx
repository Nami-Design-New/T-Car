import Image from "next/image";
import FeatureCard from "./FeatureCard";
import type { HomeWhyUsCard, HomeWhyUsContent } from "../model";

interface Props {
  content: HomeWhyUsContent;
  cards: HomeWhyUsCard[];
}

export default function WhyChooseUs({ content, cards }: Props) {
  return (
    <section
      className="relative my-12.5 lg:my-24 overflow-hidden bg-cover bg-fixed bg-center py-20 max-md:py-12"
      style={{
        backgroundImage: `linear-gradient(rgba(30,30,30,0.72),rgba(30,30,30,0.72)),url(${JSON.stringify(content.image)})`,
      }}
      id="why-choose-us"
    >
      <div className="overlay absolute inset-0 backdrop-blur-[2px]" />

      <div className="relative z-2 mx-auto w-full max-w-7xl px-2">
        <div className="grid grid-cols-[320px_1fr] items-center gap-8 max-lg:grid-cols-1 lg:gap-17.5">
          <div className="text-text-on-brand flex flex-col items-stretch justify-between gap-6">
            <span className="bg-action-primary/18 text-action-primary inline-block w-fit rounded-full px-4.5 py-2 font-bold">
              {content.eyebrow}
            </span>

            <h2 className="text-text-on-brand m-0 text-3xl leading-[1.1] font-extrabold lg:text-[52px]">
              {content.title}
            </h2>

            <p className="text-text-on-brand/85 m-0 text-[18px] leading-[1.9]">
              {content.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:gap-7">
            {cards.map((card) => (
              <FeatureCard
                icon={
                  <Image
                    src={card.imageUrl}
                    alt=""
                    width={72}
                    height={72}
                    className="size-full rounded-xl object-cover"
                  />
                }
                title={card.title}
                description={card.description}
                key={card.id}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
