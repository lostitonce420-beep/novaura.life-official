import { useEffect, useCallback } from 'react';

/**
 * Hook for handling touch events and gestures
 */
export const useTouch = (ref, options = {}) => {
  const {
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipe,
    onPinch,
    longPressDelay = 500,
    doubleTapDelay = 300,
    swipeThreshold = 50,
  } = options;

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastTapTime = 0;
    let longPressTimer = null;
    let initialDistance = 0;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();

      // Handle pinch gesture
      if (e.touches.length === 2 && onPinch) {
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch.clientX,
          touch2.clientY - touch.clientY
        );
      }

      // Handle long press
      if (onLongPress) {
        longPressTimer = setTimeout(() => {
          onLongPress(e);
        }, longPressDelay);
      }
    };

    const handleTouchMove = (e) => {
      // Cancel long press on move
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      // Handle pinch gesture
      if (e.touches.length === 2 && onPinch) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scale = currentDistance / initialDistance;
        onPinch({ scale, distance: currentDistance });
      }
    };

    const handleTouchEnd = (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      const touch = e.changedTouches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      const touchEndTime = Date.now();
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const deltaTime = touchEndTime - touchStartTime;

      // Check for swipe
      if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
        if (onSwipe) {
          const direction =
            Math.abs(deltaX) > Math.abs(deltaY)
              ? deltaX > 0
                ? 'right'
                : 'left'
              : deltaY > 0
              ? 'down'
              : 'up';
          onSwipe({ direction, deltaX, deltaY });
        }
        return;
      }

      // Check for tap or double tap
      if (deltaTime < 200 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        const currentTime = Date.now();
        if (currentTime - lastTapTime < doubleTapDelay && onDoubleTap) {
          onDoubleTap(e);
          lastTapTime = 0;
        } else {
          if (onTap) onTap(e);
          lastTapTime = currentTime;
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      if (longPressTimer) clearTimeout(longPressTimer);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, onTap, onDoubleTap, onLongPress, onSwipe, onPinch, longPressDelay, doubleTapDelay, swipeThreshold]);
};

export default useTouch;
