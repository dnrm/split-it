"use client";

import { useState, useEffect } from "react";

// Animated Currency Line Component
function AnimatedCurrencyLine({ baseText, allSymbols, lineIndex }: { 
  baseText: string; 
  allSymbols: string; 
  lineIndex: number; 
}) {
  const [displayText, setDisplayText] = useState(baseText);
  
  useEffect(() => {
    const symbols = allSymbols.split(' ');
    
    const interval = setInterval(() => {
      setDisplayText(prev => {
        return prev.split(' ').map((char, index) => {
          // Randomly swap some characters
          if (Math.random() < 0.3) {
            return symbols[Math.floor(Math.random() * symbols.length)];
          }
          return char;
        }).join(' ');
      });
    }, 100 + (lineIndex % 5) * 50); // Vary animation speed per line
    
    return () => clearInterval(interval);
  }, [baseText, allSymbols, lineIndex]);
  
  return <>{displayText} {displayText} {displayText}</>;
}

export function AnimatedCurrencyBackground() {
  return (
    <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
      {Array.from({ length: 100 }, (_, i) => {
        const currencies = "$ ¥ € £ ₹ ₽ ₩ ₪ ₨ ₦ ₡ ₱ ₫ ₴ ₸ ₼ ₾ ₿";
        const reversedCurrencies = "₿ ₾ ₼ ₸ ₴ ₫ ₱ ₡ ₦ ₨ ₪ ₩ ₽ ₹ £ € ¥ $";
        const allSymbols = "! @ # % & * + - = ? ^ ~ | < > { } [ ] ( ) : ; \" ' ` ~ _ . , / \\";
        const isEvenLine = i % 2 === 0;
        const topPosition = -20 + (i * 2); // Start at -10rem, then -8rem, etc. (limited to stay within hero section)
        const degree = -20;
        
        return (
          <div
            key={i}
            className="absolute left-0 w-full text-4xl font-bold text-primary/30 whitespace-nowrap leading-[3rem] animate-pulse"
            style={{
              top: `${topPosition}rem`,
              transform: `rotate(${degree}deg)`,
              left: `-${Math.abs(Math.sin(degree * Math.PI / 180)) * 120}px`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${0.5 + (i % 3) * 0.2}s`
            }}
          >
            <AnimatedCurrencyLine 
              baseText={isEvenLine ? currencies : reversedCurrencies}
              allSymbols={currencies}
              lineIndex={i}
            />
          </div>
        );
      })}
    </div>
  );
}
