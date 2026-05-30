import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  ogType?: "website" | "article";
}

/**
 * Per-page SEO. Sätter title, description, canonical och OG/Twitter-taggar.
 * Använd på varje publik (utloggad) sida.
 */
export function SEO({
  title,
  description,
  path = "/",
  image = "https://toddy.se/og-image.jpg?v=3",
  ogType = "website",
}: SEOProps) {
  const url = `https://toddy.se${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content={ogType} />
      <meta property="og:locale" content="sv_SE" />
      <meta property="og:site_name" content="Toddy" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
