"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function AdminLogoutButton() {
  const router = useRouter();

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }, [router]);

  return (
    <button type="button" className="admin-logout" onClick={logout}>
      Log out
    </button>
  );
}
