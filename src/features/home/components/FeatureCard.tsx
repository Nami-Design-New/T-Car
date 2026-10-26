import React, { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: Props) {
  return (
    <div className="flex flex-col lg:flex-row  items-center lg:items-start gap-2 lg:gap-5.5 rounded-2xl border border-text-on-brand/8 bg-text-on-brand/8 p-2 lg:p-7 backdrop-blur-md transition duration-300 hover:-translate-y-2.5 hover:border-action-primary/40 hover:bg-text-on-brand/12 hover:shadow-[0_18px_40px_rgba(30,30,30,0.25)]">
      <div className="icon flex size-12  lg:size-18 text-3xl text-white shrink-0 items-center justify-center rounded-xl bg-action-primary transition duration-300 hover:shadow-[0_0_30px_rgba(31,127,250,0.55)]">
        {icon}
      </div>

      <div className="text-center lg:text-start">
        <h3 className="m-0 lg:m-0 mb-2 lg:mb-2.5 text-base lg:text-[22px] font-bold text-text-on-brand">
          {title}
        </h3>

        <p className="m-0 text-xs leading-[1.9] text-text-on-brand/75">
          {description}
        </p>
      </div>
    </div>
  );
}
