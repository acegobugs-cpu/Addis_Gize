export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[var(--color-canvas)]">
      <div className="relative h-16 w-16">
        {/* Outer East Ring */}
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-[var(--color-east-light)] border-t-[var(--color-east)] duration-1000"></div>
        {/* Inner West Ring (Spins Counter-Clockwise) */}
        <div className="absolute inset-2 animate-[spin_1.5s_linear_infinite_reverse] rounded-full border-4 border-[var(--color-west-light)] border-b-[var(--color-west)]"></div>
      </div>
    </div>
  );
}