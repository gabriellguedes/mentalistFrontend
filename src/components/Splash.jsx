import React, { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";

export default function Splash({ onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 40);
    const t2 = setTimeout(() => setVisible(false), 1500);
    const t3 = setTimeout(() => onDone?.(), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <BrandLogo size={104} />
      <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Estudante Mentalista
      </p>
    </div>
  );
}
