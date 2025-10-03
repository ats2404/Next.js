import type { SVGProps } from 'react';

export function AtsLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22h-6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v2" />
      <path d="M14 2v6h6" />
      <path d="m15.5 14-3 3 3 3" />
      <path d="m19.5 14-3 3 3 3" />
    </svg>
  );
}
