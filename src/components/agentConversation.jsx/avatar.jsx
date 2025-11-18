"use client";
export function Avatar({ children, className = "" }) {
  return <div className={`inline-flex items-center justify-center rounded-full ${className}`}>{children}</div>;
}
export function AvatarImage({ src, alt }) {
  return <img src={src} alt={alt} className="w-full h-full object-cover" />;
}
export function AvatarFallback({ children }) {
  return <div className="flex items-center justify-center w-full h-full bg-gray-300 text-gray-700">{children}</div>;
}
