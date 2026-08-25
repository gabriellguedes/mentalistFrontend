import React from "react";

const SRC =
  "https://media.base44.com/images/public/6a84b489b7a36c4d68b9251e/73e32bc0a_file_000000002c2c820e9f882372d31c9cdb.png";

export default function BrandLogo({
  size = 40,
  className = "",
  alt = "O Estudante Mentalista",
}) {
  return (
    <img
      src={SRC}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}
