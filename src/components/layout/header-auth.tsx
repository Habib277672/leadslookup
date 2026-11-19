import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";

export function HeaderAuth({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <div className="hidden items-center gap-2 lg:flex">
        {signedIn ? (
          <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
            Dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              Log in
            </Link>
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Get started
            </Link>
          </>
        )}
      </div>
      <MobileNav signedIn={signedIn} />
    </>
  );
}
