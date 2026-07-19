import type { MetadataRoute } from "next";
export default function robots():MetadataRoute.Robots{const base=process.env.NEXT_PUBLIC_SITE_URL||"https://dhv365.nl";return {rules:[{userAgent:"*",allow:"/",disallow:["/api/","/portal/","/app/"]}],sitemap:`${base}/sitemap.xml`,host:base}}
