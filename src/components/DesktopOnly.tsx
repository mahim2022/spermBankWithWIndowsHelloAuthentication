"use client";
import { useEffect, useState } from "react";

export default function DesktopOnly({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const mobileRegex = /(android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini)/i;
    setIsDesktop(!mobileRegex.test(ua));
  }, []);

  if (!isDesktop) {
    return <div style={{ padding: 20 }}>🚫 This application is only available on desktop devices.</div>;
  }

  return <>{children}</>;
}
