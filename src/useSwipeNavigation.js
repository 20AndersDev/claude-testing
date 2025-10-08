import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const useSwipeNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    const minSwipeDistance = 75;
    const maxVerticalDistance = 50;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchMove = (e) => {
      const currentX = e.changedTouches[0].screenX;
      const deltaX = currentX - touchStartX;

      // Add visual feedback during swipe
      if (Math.abs(deltaX) > 10) {
        const container = document.querySelector('.page-transition-container');
        if (container && !isTransitioning) {
          container.style.transform = `translateX(${deltaX * 0.3}px)`;
        }
      }
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;

      // Reset visual feedback
      const container = document.querySelector('.page-transition-container');
      if (container) {
        container.style.transform = '';
      }

      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeDistance = touchEndX - touchStartX;
      const verticalDistance = Math.abs(touchEndY - touchStartY);

      // Only trigger swipe if horizontal swipe is significant and vertical movement is minimal
      if (Math.abs(swipeDistance) < minSwipeDistance || verticalDistance > maxVerticalDistance) return;

      const currentPath = location.pathname;

      if (isTransitioning) return;
      setIsTransitioning(true);

      // Swipe left (next page)
      if (swipeDistance < 0) {
        if (currentPath === '/feed') {
          navigate('/search');
        } else if (currentPath === '/search') {
          navigate('/profile');
        }
      }

      // Swipe right (previous page)
      if (swipeDistance > 0) {
        if (currentPath === '/profile') {
          navigate('/search');
        } else if (currentPath === '/search') {
          navigate('/feed');
        }
      }

      setTimeout(() => setIsTransitioning(false), 300);
    };

    // Only add listeners on screens where bottom nav is visible (max-width: 1088px)
    const mediaQuery = window.matchMedia('(max-width: 1088px)');

    const addListeners = () => {
      if (mediaQuery.matches) {
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
      }
    };

    const removeListeners = () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    addListeners();
    mediaQuery.addEventListener('change', (e) => {
      if (e.matches) {
        addListeners();
      } else {
        removeListeners();
      }
    });

    return () => {
      removeListeners();
    };
  }, [navigate, location]);
};

export default useSwipeNavigation;
