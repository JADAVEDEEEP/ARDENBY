export default function SuperAdminUsersPage() {
  return (
    <section className="border border-[#e7ddd1] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a18158]">
        User Management
      </p>
      <h2 className="mt-2 font-serif text-2xl text-[#171717]">
        Super Admin user controls
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#736a60]">
        This placeholder is ready for later Super Admin-only user management
        APIs protected by authorizeRoles(&quot;superadmin&quot;).
      </p>
    </section>
  );
}
