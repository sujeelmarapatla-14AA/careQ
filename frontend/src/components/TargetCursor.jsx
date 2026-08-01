import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import './TargetCursor.css';

const TargetCursor = ({
  targetSelector = '.cursor-target, .btn-heltro, .btn-heltro-outline',
  spinDuration = 2,
  hideDefaultCursor = false,
  hoverDuration = 0.2,
  parallaxOn = false,
  cursorColor = '#003B65',
  cursorColorOnTarget = '#0066B2'
}) => {
  const cursorRef = useRef(null);
  const cornersRef = useRef(null);
  const dotRef = useRef(null);
  const isHoveringRef = useRef(false);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    return hasTouchScreen || isSmallScreen;
  }, []);

  const moveCursor = useCallback((e) => {
    if (!cursorRef.current) return;
    gsap.to(cursorRef.current, {
      x: e.clientX,
      y: e.clientY,
      duration: 0.08,
      ease: 'power2.out'
    });
  }, []);

  useEffect(() => {
    if (isMobile || !cursorRef.current) return;

    const cursor = cursorRef.current;
    cornersRef.current = cursor.querySelectorAll('.target-cursor-corner');

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      opacity: 0
    });

    const onMouseMove = (e) => {
      gsap.to(cursor, { opacity: 1, duration: 0.2 });
      moveCursor(e);
    };

    const onMouseLeaveWindow = () => {
      gsap.to(cursor, { opacity: 0, duration: 0.2 });
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeaveWindow);

    const handleMouseOver = (e) => {
      const target = e.target.closest ? e.target.closest(targetSelector) : null;
      if (target && cornersRef.current) {
        isHoveringRef.current = true;
        const rect = target.getBoundingClientRect();
        const cursorX = gsap.getProperty(cursor, 'x');
        const cursorY = gsap.getProperty(cursor, 'y');
        
        const corners = Array.from(cornersRef.current);
        const positions = [
          { x: rect.left - cursorX - 4, y: rect.top - cursorY - 4 },
          { x: rect.right - cursorX - 8, y: rect.top - cursorY - 4 },
          { x: rect.right - cursorX - 8, y: rect.bottom - cursorY - 8 },
          { x: rect.left - cursorX - 4, y: rect.bottom - cursorY - 8 }
        ];

        corners.forEach((corner, i) => {
          gsap.to(corner, {
            x: positions[i].x,
            y: positions[i].y,
            borderColor: cursorColorOnTarget,
            duration: 0.2,
            ease: 'power2.out'
          });
        });
      }
    };

    const handleMouseOut = (e) => {
      const target = e.target.closest ? e.target.closest(targetSelector) : null;
      if (target && cornersRef.current) {
        isHoveringRef.current = false;
        const corners = Array.from(cornersRef.current);
        const defaultPositions = [
          { x: -18, y: -18 },
          { x: 6, y: -18 },
          { x: 6, y: 6 },
          { x: -18, y: 6 }
        ];

        corners.forEach((corner, i) => {
          gsap.to(corner, {
            x: defaultPositions[i].x,
            y: defaultPositions[i].y,
            borderColor: cursorColor,
            duration: 0.25,
            ease: 'power3.out'
          });
        });
      }
    };

    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mouseout', handleMouseOut, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeaveWindow);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
    };
  }, [isMobile, moveCursor, targetSelector, cursorColor, cursorColorOnTarget]);

  if (isMobile) return null;

  return (
    <div ref={cursorRef} className="target-cursor-wrapper">
      <div ref={dotRef} className="target-cursor-dot" style={{ backgroundColor: cursorColor }} />
      <div className="target-cursor-corner corner-tl" style={{ borderColor: cursorColor }} />
      <div className="target-cursor-corner corner-tr" style={{ borderColor: cursorColor }} />
      <div className="target-cursor-corner corner-br" style={{ borderColor: cursorColor }} />
      <div className="target-cursor-corner corner-bl" style={{ borderColor: cursorColor }} />
    </div>
  );
};

export default TargetCursor;
