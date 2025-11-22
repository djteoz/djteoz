"use client";
"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageLoader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timeout);
  }, [pathname]);

  if (!loading) return null;
  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50">
      <div
        className="h-1 bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-500 animate-page-loader"
        style={{ width: "100%" }}
      />
    </div>
  );
}
