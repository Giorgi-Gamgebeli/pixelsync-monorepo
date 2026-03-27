import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return Response.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "bot" },
      signal: AbortSignal.timeout(5000),
    });

    const html = await res.text();

    const getMetaContent = (property: string): string | null => {
      const regex = new RegExp(
        `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
        "i",
      );
      const match = html.match(regex);
      return match?.[1] || match?.[2] || null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);

    const data = {
      title: getMetaContent("og:title") || titleMatch?.[1]?.trim() || null,
      description:
        getMetaContent("og:description") ||
        getMetaContent("description") ||
        null,
      image: getMetaContent("og:image") || null,
      siteName: getMetaContent("og:site_name") || new URL(url).hostname,
    };

    if (!data.title && !data.description) {
      return Response.json({ error: "No metadata found" }, { status: 404 });
    }

    return Response.json(data, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return Response.json({ error: "Failed to fetch" }, { status: 502 });
  }
}
