// StructuredData.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

// Organization Schema
export const OrganizationSchema = ({ 
  name = 'FitTrainer Pro',
  url = 'https://fittrainerpro.com',
  logo = 'https://fittrainerpro.com/logo.png',
  contactPoint,
  sameAs = []
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    sameAs,
    ...(contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        ...contactPoint
      }
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Local Business Schema for Gyms/Fitness Centers
export const GymSchema = ({
  name,
  description,
  address,
  telephone,
  email,
  openingHours,
  priceRange,
  image,
  url,
  geo,
  aggregateRating
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    '@id': url,
    name,
    description,
    url,
    telephone,
    email,
    priceRange,
    image,
    address: {
      '@type': 'PostalAddress',
      ...address
    },
    ...(geo && {
      geo: {
        '@type': 'GeoCoordinates',
        ...geo
      }
    }),
    ...(openingHours && { openingHours }),
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ...aggregateRating
      }
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Person Schema for Trainers
export const TrainerSchema = ({
  name,
  description,
  image,
  url,
  email,
  telephone,
  jobTitle = 'Personal Trainer',
  worksFor,
  sameAs = [],
  knowsAbout = [],
  aggregateRating
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    description,
    image,
    url,
    email,
    telephone,
    jobTitle,
    ...(worksFor && {
      worksFor: {
        '@type': 'Organization',
        ...worksFor
      }
    }),
    sameAs,
    knowsAbout,
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ...aggregateRating
      }
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Service Schema for Training Packages
export const TrainingServiceSchema = ({
  name,
  description,
  provider,
  serviceType = 'Personal Training',
  areaServed,
  offers,
  aggregateRating
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    serviceType,
    provider: {
      '@type': 'Person',
      ...provider
    },
    ...(areaServed && { areaServed }),
    ...(offers && {
      offers: {
        '@type': 'Offer',
        ...offers
      }
    }),
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ...aggregateRating
      }
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Article Schema for Blog Posts
export const ArticleSchema = ({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author,
  publisher = {
    name: 'FitTrainer Pro',
    logo: {
      url: 'https://fittrainerpro.com/logo.png'
    }
  },
  mainEntityOfPage,
  keywords
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image,
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      ...author
    },
    publisher: {
      '@type': 'Organization',
      ...publisher,
      logo: {
        '@type': 'ImageObject',
        ...publisher.logo
      }
    },
    mainEntityOfPage: mainEntityOfPage || {
      '@type': 'WebPage',
      '@id': window.location.href
    },
    ...(keywords && { keywords })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Event Schema
export const EventSchema = ({
  name,
  description,
  startDate,
  endDate,
  location,
  image,
  organizer,
  offers,
  performer,
  eventStatus = 'https://schema.org/EventScheduled'
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    endDate,
    eventStatus,
    image,
    location: {
      '@type': 'Place',
      ...location
    },
    organizer: {
      '@type': 'Organization',
      ...organizer
    },
    ...(offers && {
      offers: {
        '@type': 'Offer',
        ...offers
      }
    }),
    ...(performer && {
      performer: {
        '@type': 'Person',
        ...performer
      }
    })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Breadcrumb Schema
export const BreadcrumbSchema = ({ items }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// FAQ Schema
export const FAQSchema = ({ questions }) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Review Schema
export const ReviewSchema = ({
  itemReviewed,
  reviewRating,
  author,
  datePublished,
  reviewBody
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Service',
      ...itemReviewed
    },
    reviewRating: {
      '@type': 'Rating',
      ...reviewRating
    },
    author: {
      '@type': 'Person',
      ...author
    },
    datePublished,
    reviewBody
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// Search Action Schema
export const SearchActionSchema = ({
  target = 'https://fittrainerpro.com/search?q={search_term_string}',
  queryInput = 'required name=search_term_string'
}) => {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://fittrainerpro.com',
    potentialAction: {
      '@type': 'SearchAction',
      target,
      'query-input': queryInput
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default {
  SEOHelmet,
  OrganizationSchema,
  GymSchema,
  TrainerSchema,
  TrainingServiceSchema,
  ArticleSchema,
  EventSchema,
  BreadcrumbSchema,
  FAQSchema,
  ReviewSchema,
  SearchActionSchema
};
