export default function AdminCouponsPage() {
  return (
    <section className="border border-[#e7ddd1] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a18158]">
        Coupons
      </p>
      <h2 className="mt-2 font-serif text-2xl text-[#171717]">
        Coupon management
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#736a60]">
        This page will use the shared admin coupon APIs: create, list, update,
        and delete coupons with admin or superadmin access.
      </p>
    </section>
  );
}
