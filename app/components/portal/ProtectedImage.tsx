"use client";

type Props = {
  src?: string | null;
  alt: string;
  fallbackInitial?: string;
};

export default function ProtectedImage({ src, alt, fallbackInitial }: Props) {
  // If no source is provided, show the initials fallback
  if (!src || src === "") {
    return (
      <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-2xl uppercase">
        {fallbackInitial || "?"}
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden"
      onContextMenu={(e) => e.preventDefault()} // Block Right Click
    >
      <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover pointer-events-none select-none"
          onError={(e) => {
            // If the image fails to load, hide the broken icon and show the fallback
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement!.innerHTML = `<div class="flex items-center justify-center w-full h-full font-bold text-slate-400">${fallbackInitial || '?'}</div>`;
          }}
      />
    </div>
  );
}
