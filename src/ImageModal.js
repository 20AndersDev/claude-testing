import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './ImageModal.css';

function ImageModal({ images, initialIndex = 0, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');

  const handleOverlayClick = (e) => {
    // Close if clicking on the overlay itself, not on any child elements
    if (e.target.classList.contains('image-modal-overlay') ||
        e.target.classList.contains('image-modal-content') ||
        e.target.classList.contains('image-modal-container')) {
      onClose();
    }
  };

  const nextImage = () => {
    if (isTransitioning || images.length <= 1) return;
    setSlideDirection('next');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
      setTimeout(() => {
        setIsTransitioning(false);
        setSlideDirection('');
      }, 150);
    }, 150);
  };

  const prevImage = () => {
    if (isTransitioning || images.length <= 1) return;
    setSlideDirection('prev');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
      setTimeout(() => {
        setIsTransitioning(false);
        setSlideDirection('');
      }, 150);
    }, 150);
  };

  const goToImage = (index) => {
    if (isTransitioning || index === currentImageIndex) return;
    const direction = index > currentImageIndex ? 'next' : 'prev';
    setSlideDirection(direction);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex(index);
      setTimeout(() => {
        setIsTransitioning(false);
        setSlideDirection('');
      }, 150);
    }, 150);
  };

  // Handle escape key and arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  // Handle touch events for swipe
  useEffect(() => {
    let startX = 0;
    let endX = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      endX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (!startX || !endX) return;

      const difference = startX - endX;
      const threshold = 50;

      if (Math.abs(difference) > threshold) {
        if (difference > 0) {
          nextImage(); // Swipe left, go to next
        } else {
          prevImage(); // Swipe right, go to previous
        }
      }

      startX = 0;
      endX = 0;
    };

    const modalElement = document.querySelector('.image-modal-overlay');
    if (modalElement) {
      modalElement.addEventListener('touchstart', handleTouchStart);
      modalElement.addEventListener('touchmove', handleTouchMove);
      modalElement.addEventListener('touchend', handleTouchEnd);

      return () => {
        modalElement.removeEventListener('touchstart', handleTouchStart);
        modalElement.removeEventListener('touchmove', handleTouchMove);
        modalElement.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, []);

  if (!images || images.length === 0) return null;

  return createPortal(
    <div className="image-modal-overlay" onClick={handleOverlayClick}>
      <div className="image-modal-content">
        <button className="image-modal-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>✕</button>

        <div className="image-modal-container">
          <div className="image-modal-main">
            <img
              src={images[currentImageIndex].url}
              alt={`${currentImageIndex + 1}`}
              loading="lazy"
              className={`image-modal-img ${isTransitioning ? 'transitioning' : ''} ${slideDirection ? `slide-${slideDirection}` : ''}`}
              onClick={(e) => e.stopPropagation()}
            />

            {images.length > 1 && (
              <>
                <button
                  className="image-modal-nav-btn image-modal-prev-btn"
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  className="image-modal-nav-btn image-modal-next-btn"
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  aria-label="Next image"
                >
                  ›
                </button>
                <div className="image-modal-counter">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="image-modal-dots">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`image-modal-dot ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); goToImage(index); }}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ImageModal;