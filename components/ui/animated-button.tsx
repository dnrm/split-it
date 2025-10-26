'use client';

import { motion } from 'motion/react';
import { Button, ButtonProps } from '@/components/ui/button';
import { forwardRef } from 'react';

interface AnimatedButtonProps extends ButtonProps {
  animationType?: 'scale' | 'lift' | 'bounce';
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ animationType = 'scale', children, className, ...props }, ref) => {
    const getAnimationProps = () => {
      switch (animationType) {
        case 'lift':
          return {
            whileHover: { y: -2 },
            whileTap: { y: 0 }
          };
        case 'bounce':
          return {
            whileHover: { scale: 1.05 },
            whileTap: { scale: 0.95 }
          };
        case 'scale':
        default:
          return {
            whileHover: { scale: 1.02 },
            whileTap: { scale: 0.98 }
          };
      }
    };

    return (
      <motion.div
        {...getAnimationProps()}
        transition={{ duration: 0.2 }}
      >
        <Button
          ref={ref}
          className={className}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';
