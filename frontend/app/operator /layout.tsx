"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function OperatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const authenticated =
      sessionStorage.getItem(
        "procuresmart_operator_authenticated"
      ) === "true";

    if (!authenticated && pathname !== "/operator/login") {
      router.replace("/operator/login");
      return;
    }

    setChecking(false);
  }, [pathname, router]);

  if (checking && pathname !== "/operator/login") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f2ea]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#d8d2c5] border-t-[#244b3a]" />

          <p className="mt-4 text-sm font-semibold text-[#667169]">
            Checking access...
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
