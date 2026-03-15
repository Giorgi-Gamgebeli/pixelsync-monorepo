"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type OgData = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string;
};

const URL_REGEX = /https?:\/\/[^\s<]+/g;

function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match?.[0] || null;
}

function LinkPreview({ text }: { text: string }) {
  const [ogData, setOgData] = useState<OgData | null>(null);
  const url = extractFirstUrl(text);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;

    fetch(`/api/og?url=${encodeURIComponent(url)}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setOgData(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!ogData) return null;

  return (
    <a
      href={url!}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1.5 block max-w-xs overflow-hidden rounded-lg border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
    >
      {ogData.image && (
        <div className="relative h-32 w-full">
          <Image
            src={ogData.image}
            alt=""
            fill
            className="object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="px-3 py-2">
        <p className="text-[10px] text-gray-500">{ogData.siteName}</p>
        {ogData.title && (
          <p className="mt-0.5 truncate text-xs font-semibold text-blue-400">
            {ogData.title}
          </p>
        )}
        {ogData.description && (
          <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-400">
            {ogData.description}
          </p>
        )}
      </div>
    </a>
  );
}

export { extractFirstUrl, URL_REGEX };
export default LinkPreview;
