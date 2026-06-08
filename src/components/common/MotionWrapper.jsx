import React from 'react';
import { motion } from 'framer-motion';

export const FadeIn = ({ children, delay = 0, duration = 0.4, className = '', style, ...props }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration, delay, ease: 'easeOut' }}
    className={className}
    style={style}
    {...props}
  >
    {children}
  </motion.div>
);

export const SlideUp = ({ children, delay = 0, duration = 0.5, yOffset = 30, className = '', style, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: yOffset }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration, delay, ease: [0.165, 0.84, 0.44, 1] }}
    className={className}
    style={style}
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerContainer = ({ children, staggerDelay = 0.1, delayChildren = 0, className = '', style, ...props }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delayChildren,
      },
    },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className={className} style={style} {...props}>
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, yOffset = 20, duration = 0.4, className = '', style, ...props }) => {
  const itemVariants = {
    hidden: { opacity: 0, y: yOffset },
    show: { opacity: 1, y: 0, transition: { duration, ease: 'easeOut' } },
  };

  return (
    <motion.div variants={itemVariants} className={className} style={style} {...props}>
      {children}
    </motion.div>
  );
};

export const HoverCard = ({ children, className = '', scale = 1.02, style, ...props }) => (
  <motion.div
    whileHover={{ scale, y: -4 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    className={className}
    style={style}
    {...props}
  >
    {children}
  </motion.div>
);
