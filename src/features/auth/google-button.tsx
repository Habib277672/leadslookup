import { buttonVariants } from "@/components/ui/button";

// A plain link: this is a full-page navigation to our start route, which redirects to Google.
export function GoogleButton({
  label = "Continue with Google",
}: {
  label?: string;
}) {
  return (
    <a
      href="/api/v1/auth/google/start"
      className={`${buttonVariants({ variant: "outline", size: "lg" })} w-full`}
    >
      {label}
    </a>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">or</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
