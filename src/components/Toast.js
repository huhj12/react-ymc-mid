import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import './Toast.css';

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 1500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="toast"
      initial={{ opacity: 0, scale: 0.92, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 14 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {message}
    </motion.div>
  );
}

export default Toast;
