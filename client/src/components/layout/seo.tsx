import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const DEFAULT_TITLE = "SwissGain India | Premium 1 Gram Gold Plated Jewelry";
const DEFAULT_DESCRIPTION = "Experience the finest Swiss-crafted 1 gram gold plated jewelry. Elevate your elegance with our exquisite premium collections.";
const DEFAULT_IMAGE = "https://swissgainindia.com/logo.png";
const DEFAULT_URL = "https://swissgainindia.com";

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url = DEFAULT_URL,
  type = "website",
}: SEOProps) {
  // Normalize URLs to ensure absolute paths for crawlers
  const absoluteImage = image.startsWith("http") ? image : `${DEFAULT_URL}${image}`;
  const absoluteUrl = url.startsWith("http") ? url : `${DEFAULT_URL}${url}`;

  return (
    <Helmet>
      {/* Standard HTML Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph (Facebook / LinkedIn) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:site_name" content="SwissGain India" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
    </Helmet>
  );
}
