import Link from 'next/link';

const SERIF = { fontFamily: 'var(--font-oswald), Impact, sans-serif' };

export default function NotFound() {
  return (
    <main
      className="flex min-h-[70vh] items-center bg-white justify-center px-4 py-20 text-center text-[#171717]"
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8C6D3A]">
          Error 404
        </p>
        <h1 className="mt-4 text-[40px] leading-none sm:text-[60px]" style={SERIF}>
          This piece has moved on.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-7 text-[#171717]/65">
          The page you are looking for does not exist or is no longer available.
        </p>
        <Link
          href="/shop"
          className="mt-9 inline-flex min-h-[48px] items-center rounded-[2px] bg-[#222222] px-8 text-[11px] font-bold uppercase tracking-[0.16em] text-[#FFFFFF]  transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08D57]/70"
        >
          Explore collections
        </Link>
      </div>
    </main>
  );
}
