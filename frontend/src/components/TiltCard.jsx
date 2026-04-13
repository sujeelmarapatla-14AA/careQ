import React, { useRef, useState } from 'react';

// Lightweight Mouse Tracking 3D Component
export default function TiltCard({ children, className = '', tiltIntensity = 5, style = {} }) {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -tiltIntensity;
    const rotateY = ((x - centerX) / centerX) * tiltIntensity;

    setRotation({ x: rotateX, y: rotateY });
    setGlarePosition({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      className={`glass-panel tilt-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        // Removed the scale3d pop to prevent the "bulging" sensation. Lowered perspective constraint to keep it flush.
        transform: `perspective(1500px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1, 1, 1)`,
        transition: isHovered ? 'none' : 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      {/* Glare Sub-Layer */}
      <div 
        className="glare" 
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.08) 0%, transparent 50%)`,
          opacity: isHovered ? 1 : 0, transition: 'opacity 0.4s', pointerEvents: 'none', borderRadius: 'inherit'
        }} 
      />
      
      {/* Reduced Z-axis thrust significantly from 30px to 5px so the text doesn't burst forward aggressively */}
      <div style={{ transform: isHovered ? 'translateZ(5px)' : 'translateZ(0px)', transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
        {children}
      </div>
    </div>
  );
}
