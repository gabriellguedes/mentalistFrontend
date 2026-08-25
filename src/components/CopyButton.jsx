import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { sounds } from "@/lib/sound";

export default function CopyButton({
  text,
  label = "Copiar Prompt de IA",
  className = "",
  variant = "secondary",
  size = "sm",
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    sounds.click();
    await navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onCopy}
      className={className}
    >
      {copied ? (
        <Check className="mr-2 h-4 w-4 text-accent" />
      ) : (
        <Copy className="mr-2 h-4 w-4" />
      )}
      {copied ? "Copiado!" : label}
    </Button>
  );
}
