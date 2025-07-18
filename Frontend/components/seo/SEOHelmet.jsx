// SEOHelmet.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEOHelmet = ({
  title,
  description,
  keywords,
  image,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  canonicalUrl,
  noindex = false,
  nofollow = false,
  locale = 'th_TH',
  alternateLanguages = [],
  structuredData,
  customMeta = []
}) => {
  const location = useLocation();
  const baseUrl = 'https://fittrainerpro.com';
  
  // Default values
  const defaultTitle = 'FitTrainer Pro - ค้นหาเทรนเนอร์ออกกำลังกายมืออาชีพ';
  const defaultDescription = 'แพลตฟอร์มค้นหาและจองเทรนเนอร์ออกกำลังกายส่วนตัวที่ดีที่สุดในประเทศไทย พร้อมระบบติดตามความก้าวหน้าและแผนโภชนาการ';
  const defaultImage = `${baseUrl}/images/og-default.jpg`;
  const defaultKeywords = 'เทรนเนอร์, ออกกำลังกาย, ฟิตเนส, personal trainer, โค้ชออกกำลังกาย, ลดน้ำหนัก, เพิ่มกล้ามเนื้อ';

  // Construct full URL
  const fullUrl = canonicalUrl || `${baseUrl}${location.pathname}${location.search}`;
  const pageTitle = title ? `${title} | FitTrainer Pro` : defaultTitle;
  const metaDescription = description || defaultDescription;
  const metaImage = image || defaultImage;
  const metaKeywords = keywords || defaultKeywords;

  // Robots meta
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow'
  ].join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="robots" content={robotsContent} />
      <meta name="author" content={author || 'FitTrainer Pro'} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:alt" content={pageTitle} />
      <meta property="og:locale" content={locale} />
      <meta property="og:site_name" content="FitTrainer Pro" />

      {/* Article specific meta */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:site" content="@FitTrainerPro" />

      {/* Alternate Languages */}
      {alternateLanguages.map((lang) => (
        <link
          key={lang.code}
          rel="alternate"
          hrefLang={lang.code}
          href={`${baseUrl}/${lang.code}${location.pathname}`}
        />
      ))}

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="theme-color" content="#232956" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Custom Meta Tags */}
      {customMeta.map((meta, index) => (
        <meta key={index} {...meta} />
      ))}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHelmet;
