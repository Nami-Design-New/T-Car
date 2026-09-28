interface LoaderProps {
  fullScreen?: boolean;
}

import Image from "next/image";

import logoText from "@/assets/icons/logo-text.svg";
import logoCar from "@/assets/icons/logo-car.svg";

export default function Loader({
  fullScreen = true,
}: LoaderProps) {
  return (
    <div className={fullScreen ? "loader_fullscreen" : "loader_inline"}>
      <div className="logo_loader">
        <div className="car">
          <Image src={logoCar} alt="Car" priority />
        </div>
        <div className="text">
          <Image src={logoText} alt="Logo" priority />
        </div>
      </div>
    </div>
  );
}