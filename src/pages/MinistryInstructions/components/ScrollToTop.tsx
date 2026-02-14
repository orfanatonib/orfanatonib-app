import React, { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import { KeyboardArrowUp as ScrollTopIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 100 }}
                >
                    <IconButton
                        onClick={scrollToTop}
                        sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                            width: 56, height: 56,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                        }}
                    >
                        <ScrollTopIcon />
                    </IconButton>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ScrollToTop;
