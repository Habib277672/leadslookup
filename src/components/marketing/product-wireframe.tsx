const filters = ["Category", "Country", "Region", "City"];

export function ProductWireframe() {
  return (
    <figure>
      <div
        role="img"
        aria-label="Wireframe of the planned Find Leads screen: category and location filters above a list of result rows."
        className="overflow-hidden rounded-md border border-border bg-surface-raised"
      >
        <div aria-hidden="true" className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {filters.map((label) => (
              <div
                key={label}
                className="rounded-md border border-dashed border-border px-3 py-2"
              >
                <div className="text-xs text-text-secondary">{label}</div>
                <div className="mt-1.5 h-2 w-2/3 rounded-xs bg-surface-secondary" />
              </div>
            ))}
          </div>
          <div className="mt-4 divide-y divide-border rounded-md border border-border">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-3 p-3">
                <div className="size-8 shrink-0 rounded-xs bg-surface-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-1/2 rounded-xs bg-surface-secondary" />
                  <div className="h-2 w-3/4 rounded-xs bg-surface-secondary" />
                </div>
                <div className="h-6 w-14 rounded-xs border border-dashed border-border" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-text-secondary">
        Wireframe of the planned Find Leads screen. Layout only, with no real
        business data.
      </figcaption>
    </figure>
  );
}
