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


export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" strokeWidth="1" />
      <path d="M21.9999 12C21.9999 11.2374 21.9334 10.4841 21.8049 9.75H12.0134V14.0625H17.6834C17.4334 15.6525 16.5134 17.01 14.9834 17.9325V20.5875H18.5209C20.6959 18.6675 21.9999 15.6 21.9999 12Z" fill="#4285F4" stroke="none" />
      <path d="M12.0134 22C15.0134 22 17.5634 21.015 19.5209 19.5875L15.9834 16.9325C14.9959 17.6025 13.6209 18 12.0134 18C8.89591 18 6.22091 15.9075 5.25341 13.05H1.59591V15.795C3.51341 19.53 7.42091 22 12.0134 22Z" fill="#34A853" stroke="none" />
      <path d="M5.2535 13.05C5.0285 12.3825 4.9035 11.6925 4.9035 11C4.9035 10.3075 5.0285 9.6175 5.2535 8.95L1.59599 6.2025C0.588496 8.2275 0.0134964 10.53 0.0134964 13C0.0134964 15.47 0.588496 17.7725 1.59599 19.7975L5.2535 17.05V13.05Z" fill="#FBBC05" stroke="none" />
      <path d="M12.0134 5C13.7959 5 15.1959 5.64 15.9834 6.39L19.5959 2.775C17.5559 0.945 15.0059 0 12.0134 0C7.42091 0 3.51341 2.47 1.59591 6.2025L5.25341 8.95C6.22091 6.0975 8.89591 4 12.0134 4V5Z" fill="#EA4335" stroke="none" />
    </svg>
  )
}

export function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

export function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 1.4 2.8 3.2 3 5.2-1.4 1-2.3.2-4.1.1-1.5 2.5-3.1 4.5-5.5 6.2-1.7 1.2-3 2.5-5.5 2.5-3.2 0-2.3-1.6-3.2-3.2-1.7-3.1.2-5.3 1.2-7.3-1.2-1-2.9.2-3.9 1.1 1-1.6 2.5-3.2 4.6-4.5 1.5-.9 3.4-1.4 5.3-1.2.6-.7 1.2-1.1 2.2-1.3.6-.1 1.7-.2 2.7.5-.3-1.8 1-3.4 2.9-4.1.9-.3 2.1.2 2.6.6.3.2.5.5.7.8z" />
    </svg>
  );
}
