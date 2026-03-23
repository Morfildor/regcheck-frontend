import { Helmet } from "react-helmet-async";

const APP_TITLE = "RuleGrid";
const APP_DESCRIPTION =
  "Analyzer-first EU regulatory scoping for compliance, engineering, and sourcing teams.";
const APP_URL = "https://rulegrid.net";

/**
 * @typedef {Object} PageMetaConfig
 * @property {string} title
 * @property {string} [description]
 * @property {string} [canonicalPath]
 */

/**
 * @param {PageMetaConfig} props
 */
export default function PageMeta({ title, description = APP_DESCRIPTION, canonicalPath = "" }) {
  const fullTitle = title === APP_TITLE ? APP_TITLE : `${title} | ${APP_TITLE}`;
  const canonical = canonicalPath ? `${APP_URL}${canonicalPath}` : APP_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={APP_TITLE} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary_large_image" />
      <link rel="canonical" href={canonical} />
    </Helmet>
  );
}
