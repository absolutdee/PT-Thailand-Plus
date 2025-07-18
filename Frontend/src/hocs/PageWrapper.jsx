// PageWrapper.jsx
import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import ScrollToTop from '../components/ScrollToTop';
import { motion } from 'framer-motion';
import './PageWrapper.scss';

const PageWrapper = ({ 
  children, 
  title, 
  breadcrumbs = [], 
  containerClass = '',
  fluid = false,
  showBreadcrumbs = true,
  animate = true 
}) => {
  const location = useLocation();

  useEffect(() => {
    // Update page title
    if (title) {
      document.title = `${title} - FitTrainer Pro`;
    }

    // Track page view (Google Analytics or other analytics)
    if (window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: location.pathname + location.search
      });
    }
  }, [title, location]);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const content = (
    <>
      {showBreadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}
      {title && <h1 className="page-title mb-4">{title}</h1>}
      {children}
    </>
  );

  return (
    <>
      <ScrollToTop />
      {animate ? (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ duration: 0.3 }}
        >
          <Container fluid={fluid} className={`page-wrapper ${containerClass}`}>
            {content}
          </Container>
        </motion.div>
      ) : (
        <Container fluid={fluid} className={`page-wrapper ${containerClass}`}>
          {content}
        </Container>
      )}
    </>
  );
};

export default PageWrapper;
