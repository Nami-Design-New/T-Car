export interface LoaderProps {
  fullScreen?: boolean;
}

import Image from "next/image";
import { cn } from '@/shared/lib/cn';

import { IMAGES } from '@/shared/config/assets';
const logoText = IMAGES.brandText;
const logoCar = IMAGES.brandCar;

export function Loader({
  fullScreen = true,
}: LoaderProps) {
  const variantClasses = fullScreen
    ? {
        root: 'loader_fullscreen fixed inset-0 z-[999999] flex items-center justify-center bg-surface-background',
        logo: 'w-[180px]',
        car: 'animate-[carMove_0.45s_cubic-bezier(0.22,1,0.36,1)_forwards]',
      }
    : {
        root: 'loader_inline flex items-center justify-center py-10',
        logo: 'w-[120px]',
        car: 'animate-[carMoveInline_0.9s_cubic-bezier(0.22,1,0.36,1)_forwards]',
      };

  return (
    <div className={variantClasses.root}>
      <div className={cn('logo_loader relative aspect-[139/103] overflow-visible', variantClasses.logo)}>
        <div
          className={cn(
            'car absolute left-1/2 top-0 z-[2] h-[37.9%] w-full motion-reduce:animate-none motion-reduce:-translate-x-1/2',
            variantClasses.car,
          )}
        >
          <Image className="block size-full" src={logoCar} alt="Car" priority />
        </div>
        <div className="text absolute left-[30%] top-[37.9%] z-[1] h-[62.1%] w-[38.8%]">
          <Image className="block size-full" src={logoText} alt="Logo" priority />
        </div>
      </div>
    </div>
  );
}
