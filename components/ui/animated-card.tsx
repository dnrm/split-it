'use client';

import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { forwardRef } from 'react';

interface AnimatedCardProps extends React.ComponentProps<typeof Card> {
  animationType?: 'hover' | 'lift' | 'none';
  delay?: number;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ animationType = 'hover', delay = 0, children, className, ...props }, ref) => {
    const getAnimationProps = () => {
      switch (animationType) {
        case 'lift':
          return {
            whileHover: { y: -4 },
            transition: { duration: 0.2 }
          };
        case 'hover':
          return {
            whileHover: { 
              y: -2,
              transition: { duration: 0.2 }
            }
          };
        case 'none':
        default:
          return {};
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.4, 
          delay,
          ease: "easeOut"
        }}
        {...getAnimationProps()}
      >
        <Card
          ref={ref}
          className={`transition-all duration-200 ${className}`}
          {...props}
        >
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

// Export the card components for convenience
export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
