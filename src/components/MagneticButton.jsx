import React, { useRef } from 'react';

const MagneticButton = ({ children, className = "", onClick, ...props }) => {
  const btnRef = useRef(null);

  const handleMouseMove = (e) => {
    const btn = btnRef.current;
    if (!btn) return;
    const position = btn.getBoundingClientRect();
    const x = e.clientX - position.left - position.width / 2;
    const y = e.clientY - position.top - position.height / 2;
    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  };

  const handleMouseOut = () => {
    if (btnRef.current) {
      btnRef.current.style.transform = 'translate(0px, 0px)';
    }
  };

  const createRipple = (e) => {
    const btn = btnRef.current;
    if(!btn) return;
    const x = e.clientX - btn.getBoundingClientRect().left;
    const y = e.clientY - btn.getBoundingClientRect().top;
    
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    btn.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
    
    if(onClick) onClick(e);
  };

  return (
    <button 
      ref={btnRef}
      className={`magnetic-btn ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseOut}
      onClick={createRipple}
      {...props}
    >
      {children}
    </button>
  );
};

export default MagneticButton;