import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Simple pass-through. No margins, no backgrounds, no cards.
    // The individual pages will handle their own full-screen styling.
    <>
      {children}
    </>
  );
}
