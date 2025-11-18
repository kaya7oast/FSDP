"use client";
export function Input({ className = "", ...props }) {
  return (
    <input className={`px-3 py-2 border rounded-md ${className}`} {...props} />
  );
}
