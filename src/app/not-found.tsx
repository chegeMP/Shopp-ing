import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <h1 className="text-5xl font-bold text-[#ddd] mb-2">404</h1>
      <h2 className="text-lg font-bold text-[#222] mb-1">Page not found</h2>
      <p className="text-sm text-[#666] mb-5">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="text-sm text-[#1a5dab] hover:underline"
      >
        &larr; Back to home
      </Link>
    </div>
  );
}
