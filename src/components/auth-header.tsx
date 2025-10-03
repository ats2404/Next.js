import type { ReactNode } from 'react';

export function AuthHeader({ children }: { children: ReactNode }) {
  return (
    <div className="relative bg-blue-600 text-white rounded-t-3xl pt-16 pb-12 px-8 -mx-px -mt-px">
      <svg
        className="absolute top-0 left-0 w-full h-full"
        viewBox="0 0 375 250"
        preserveAspectRatio="none"
        style={{ transform: 'translateY(-1px)' }}
      >
        <path
          d="M0,150 C100,250 250,100 375,200 V0 H0 Z"
          className="fill-current text-blue-600"
        />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
