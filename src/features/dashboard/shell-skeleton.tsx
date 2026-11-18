export function ShellSkeleton() {
  return (
    <div className="flex min-h-svh" aria-busy="true">
      <div className="hidden w-60 shrink-0 border-r border-border lg:block" />
      <div className="flex-1">
        <div className="h-14 border-b border-border" />
        <p
          className="px-4 py-8 text-sm text-muted-foreground sm:px-6"
          role="status"
        >
          Loading…
        </p>
      </div>
    </div>
  );
}
