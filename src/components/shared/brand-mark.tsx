export function BrandMark() {
  return (
    <div className="flex items-center gap-3" aria-label="Pulsa Platform">
      <span
        className="grid size-9 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
        aria-hidden="true"
      >
        P
      </span>
      <div>
        <p className="text-sm font-semibold leading-tight text-foreground">Pulsa</p>
        <p className="text-xs leading-tight text-muted-foreground">Platform</p>
      </div>
    </div>
  );
}
