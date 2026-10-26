import { Link } from "@/i18n/navigation";
import { IMAGES } from "@/shared/config/assets";
import Image from "next/image";
const logo = IMAGES.brandLogo;

export default function BrandLogo() {
  return (
    <Link
      href="/"
      className=" group flex min-w-0 flex-[0_1_clamp(108px,13vw,160px)] items-center"
    >
      <Image
        src={logo}
        alt="T-Car"
        width={160}
        height={48}
        priority
        className="h-auto w-full transition duration-300 group-hover:scale-105"
      />
    </Link>
  );
}
