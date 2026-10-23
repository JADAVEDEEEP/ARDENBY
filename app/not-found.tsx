import Link from 'next/link';

const SERIF = { fontFamily: 'Bodoni MT, Didot, Times New Roman, serif' };

export default function NotFound() {
  return (
    <main
      className="flex min-h-[70vh] items-center justify-center px-4 py-20 text-center text-[#F3EBDD]"
      style={{
        backgroundColor: '#050505',
        backgroundImage:
          'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,162,75,0.14), transparent 70%)',
      }}
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#C9A24B]">
          Error 404
        </p>
        <h1 className="mt-4 text-[40px] leading-none sm:text-[60px]" style={SERIF}>
          This piece has moved on.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-7 text-[#F3EBDD]/65">
          The page you are looking for does not exist or is no longer available.
        </p>
        <Link
          href="/shop"
          className="mt-9 inline-flex min-h-[48px] items-center rounded-lg bg-[linear-gradient(135deg,#9C7A32_0%,#E6CF92_45%,#B8903A_100%)] px-8 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0A0A0A] shadow-[0_0_20px_rgba(201,162,75,0.22)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6CF92]/70"
        >
          Explore collections
        </Link>
      </div>
    </main>
  );
}
