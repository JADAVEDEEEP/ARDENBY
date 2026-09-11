import Link from 'next/link';

const content: Record<string, { title: string; text: string }> = {
  about: { title: 'About ARDENBY', text: 'ARDENBY creates premium everyday clothing for people who choose their own direction.' },
  careers: { title: 'Careers', text: 'We are building a thoughtful fashion label. New opportunities will be posted here.' },
  press: { title: 'Press', text: 'For press enquiries, reach out to hello@ardenby.com.' },
  sustainability: { title: 'Sustainability', text: 'We focus on durable fabrics, considered production, and pieces designed to be worn often.' },
  contact: { title: 'Contact us', text: 'Need help with an order or product? Email hello@ardenby.com and our team will get back to you.' },
  shipping: { title: 'Shipping policy', text: 'Orders are packed with care and typically delivered within 3 to 7 business days across India.' },
  returns: { title: 'Returns & exchange', text: 'Unused items can be returned within 7 days of delivery. Contact support to begin a return.' },
  faqs: { title: 'Frequently asked questions', text: 'Find answers about sizing, delivery, care, payments, and returns by contacting our support team.' },
  privacy: { title: 'Privacy policy', text: 'We use your information only to process orders, provide support, and improve your ARDENBY experience.' },
  terms: { title: 'Terms & conditions', text: 'By using ARDENBY, you agree to shop responsibly and provide accurate delivery information.' },
  admin: { title: 'Admin', text: 'The admin dashboard is available to authorized store staff.' },
};

export default function InformationalPage({ params }: { params: { slug: string[] } }) {
  const key = params.slug[params.slug.length - 1];
  const page = content[key] || { title: 'Page not found', text: 'This page is not available.' };
  return <div className="container-ardenby py-20 max-w-3xl"><p className="text-xs uppercase tracking-widest text-olive font-semibold">ARDENBY</p><h1 className="font-display text-5xl font-bold mt-3">{page.title}</h1><p className="text-lg text-ink-soft leading-relaxed mt-6 max-w-2xl">{page.text}</p><Link href="/shop" className="inline-block mt-8 rounded-xl bg-ink text-cream px-6 py-3 font-semibold">Back to shop</Link></div>;
}
