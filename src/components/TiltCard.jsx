import React, { useRef } from 'react';

const TiltCard = ({ children, className = "", style={} }) => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const elRect = el.getBoundingClientRect();
    const x = e.clientX - elRect.left;
    const y = e.clientY - elRect.top;
    const midX = elRect.width / 2;
    const midY = elRect.height / 2;
    const rotateX = ((y - midY) / midY) * 10;
    const rotateY = ((midX - x) / midX) * 10;
    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    }
  };

  return (
    <div 
      ref={cardRef} 
      className={`tilt-element ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
    >
      {children}
    </div>
  );
};

export default TiltCard;