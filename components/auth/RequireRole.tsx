"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ROLE_HOME, useAuth, type Role } from "@/lib/auth";

/**
 * Page ko sirf diye gaye roles ke liye khulne do.
 * Logged out -> /login?next=..., galat role -> us role ka apna dashboard.
 */
export default function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const user = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = !!user && roles.includes(user.role);

  useEffect(() => {
    if (user === undefined) return; // abhi load ho raha hai
    if (user === null) {
      // query string bhi rakho (jaise /booking?serviceId=1), warna login ke baad page toot jaata hai
      router.replace(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
    } else if (!roles.includes(user.role)) {
      router.replace(ROLE_HOME[user.role] || "/");
    }
  }, [user, roles, router, pathname]);

  if (!allowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading…
      </div>
    );
  }

  return <>{children}</>;
}
