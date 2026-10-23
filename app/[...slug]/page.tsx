import Link from 'next/link';
import { notFound } from 'next/navigation';

const content: Record<string, { title: string; text: string }> = {
  about: { title: 'About KOVENIK', text: 'KOVENIK  creates premium everyday clothing for people who choose their own direction.' },
  careers: { title: 'Careers', text: 'We are building a thoughtful fashion label. New opportunities will be posted here.' },
  press: { title: 'Press', text: 'For press enquiries, reach out to hello@ardenby.com.' },
  sustainability: { title: 'Sustainability', text: 'We focus on durable fabrics, considered production, and pieces designed to be worn often.' },
  contact: { title: 'Contact us', text: 'Need help with an order or product? Email hello@ardenby.com and our team will get back to you.' },
  shipping: { title: 'Shipping policy', text: 'Orders are packed with care and typically delivered within 3 to 7 business days across India.' },
  returns: { title: 'Returns & exchange', text: 'Unused items can be returned within 7 days of delivery. Contact support to begin a return.' },
  faqs: { title: 'Frequently asked questions', text: 'Find answers about sizing, delivery, care, payments, and returns by contacting our support team.' },
  privacy: { title: 'Privacy policy', text: 'We use your information only to process orders, provide support, and improve your KOVENIK experience.' },
  terms: { title: 'Terms & conditions', text: 'By using KOVENIK, you agree to shop responsibly and provide accurate delivery information.' },
  admin: { title: 'Admin', text: 'The admin dashboard is available to authorized store staff.' },
};

const SERIF = { fontFamily: "Bodoni MT, Didot, Times New Roman, serif" };
const GOLD_SURFACE =
  "bg-[linear-gradient(135deg,#9C7A32_0%,#E6CF92_45%,#B8903A_100%)] text-[#0A0A0A]";

export default function InformationalPage({ params }: { params: { slug: string[] } }) {
  const key = params.slug[params.slug.length - 1];
  const page = content[key];

  // Unknown addresses get a real 404 (see app/not-found.tsx).
  if (!page) notFound();

  return (
    <main
      className="min-h-[70vh] px-4 py-16 text-[#F3EBDD] sm:px-8 lg:py-24"
      style={{
        backgroundColor: "#050505",
        backgroundImage:
          "radial-gradient(ellipse 60% 40% at 85% 0%, rgba(201,162,75,0.14), transparent 70%)",
      }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rotate-45 bg-[#C9A24B]" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C9A24B]">
            KOVENIK
          </p>
        </div>

        <h1
          className="text-[36px] font-normal leading-[1.05] tracking-[-0.01em] sm:text-[52px]"
          style={SERIF}
        >
          {page.title}
        </h1>

        <div className="my-7 h-px w-24 bg-gradient-to-r from-[#C9A24B] to-transparent" />

        <p className="max-w-2xl text-[16px] leading-8 text-[#F3EBDD]/75">{page.text}</p>

        <Link
          href="/shop"
          className={"mt-10 inline-flex min-h-[48px] items-center rounded-lg px-8 text-[11px] font-bold uppercase tracking-[0.16em] shadow-[0_0_20px_rgba(201,162,75,0.22)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6CF92]/70 " + GOLD_SURFACE}
        >
          Back to shop
        </Link>
      </div>
    </main>
  );
}
