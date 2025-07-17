// index.js - Export all mobile components
export { default as MobileNavigation } from './MobileNavigation';
export { default as MobileTabBar } from './MobileTabBar';
export { default as SwipeableViews } from './SwipeableViews';
export { default as PullToRefresh } from './PullToRefresh';

// ========================================
// Usage Example - MobileAppWrapper.jsx
// ========================================
import React, { useState, useRef } from 'react';
import { 
  MobileNavigation, 
  MobileTabBar, 
  SwipeableViews, 
  PullToRefresh 
} from './components/mobile';

const MobileAppWrapper = ({ children, userType, user }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentTab, setCurrentTab] = useState('home');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const swipeableRef = useRef(null);
  const pullToRefreshRef = useRef(null);

  // Handle navigation from mobile nav drawer
  const handleNavigate = (path) => {
    // Your navigation logic here
    console.log('Navigating to:', path);
    // Example: history.push(path) or navigate(path)
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setCurrentTab(tab.id);
    handleNavigate(tab.path);
  };

  // Handle action button click
  const handleActionClick = (actionId) => {
    console.log('Action clicked:', actionId);
    // Handle different actions based on actionId
    switch(actionId) {
      case 'book-session':
        // Navigate to booking page
        break;
      case 'create-package':
        // Navigate to package creation
        break;
      // ... other cases
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh your data here
      await fetchLatestData();
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchLatestData = async () => {
    // Fetch latest data from your API
    console.log('Fetching latest data...');
  };

  return (
    <div className="mobile-app-container">
      {/* Mobile Navigation Header */}
      <MobileNavigation
        userType={userType}
        currentPage={currentView}
        onNavigate={handleNavigate}
        user={user}
      />

      {/* Main Content Area with Pull to Refresh */}
      <div className="mobile-content-area">
        <PullToRefresh
          ref={pullToRefreshRef}
          onRefresh={handleRefresh}
          disabled={isRefreshing}
        >
          {/* Swipeable Views for different sections */}
          <SwipeableViews
            ref={swipeableRef}
            activeIndex={0}
            onChangeIndex={(index) => {
              console.log('Swiped to index:', index);
            }}
            resistance={true}
          >
            {children}
          </SwipeableViews>
        </PullToRefresh>
      </div>

      {/* Bottom Tab Bar */}
      <MobileTabBar
        userType={userType}
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onActionClick={handleActionClick}
      />
    </div>
  );
};

// ========================================
// Example Implementation in App.js
// ========================================
const App = () => {
  const [userType, setUserType] = useState('client'); // or 'trainer', 'admin'
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    profileImage: null
  });

  // Check if mobile device
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    return (
      <MobileAppWrapper userType={userType} user={user}>
        {/* Your app content here */}
        <div>Page 1 Content</div>
        <div>Page 2 Content</div>
        <div>Page 3 Content</div>
      </MobileAppWrapper>
    );
  }

  // Desktop layout
  return (
    <div className="desktop-app">
      {/* Your desktop layout */}
    </div>
  );
};

// ========================================
// Integration with Existing Components
// ========================================

// Example: Integrating with ClientDashboard
import MainClientDashboard from './components/client/MainClientDashboard';

const ClientMobileApp = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user data
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  return (
    <MobileAppWrapper userType="client" user={user}>
      <MainClientDashboard />
    </MobileAppWrapper>
  );
};

export default MobileAppWrapper;
