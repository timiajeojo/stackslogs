"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Root route: send logged-in users to the dashboard, everyone else to login.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let token: string | null = null;
    try {
      token = localStorage.getItem("token");
    } catch {}
    router.replace(token ? "/dashboard" : "/login");
  }, [router]);

  return null;
}
