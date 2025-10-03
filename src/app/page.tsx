import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white">
      <h1 className="text-4xl font-bold mb-4">Welcome</h1>
      <div className="flex gap-4">
        <Link href="/login" className="px-4 py-2 bg-white text-blue-500 rounded-md">Login</Link>
        <Link href="/signup" className="px-4 py-2 bg-white text-blue-500 rounded-md">Sign Up</Link>
      </div>
    </div>
  );
}
