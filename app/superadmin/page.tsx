export default function SuperAdminPage() {
  return (
    <section className="border border-[#e7ddd1] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a18158]">
        Super Admin Only
      </p>
      <h2 className="mt-2 font-serif text-2xl text-[#171717]">
        Separate Super Admin workspace
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#736a60]">
        This area is outside the admin folder and only allows users with the
        superadmin role. User management and higher-level controls can be added
        here later.
      </p>
    </section>
  );
}
