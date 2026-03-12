import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per character
  onComplete?: () => void;
  className?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 15,
  onComplete,
  className = '',
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let index = 0;
    let timer: NodeJS.Timeout;

    // Reset on text change
    setDisplayText('');
    setIsComplete(false);

    const typeNext = () => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
        timer = setTimeout(typeNext, speed);
      } else {
        setIsComplete(true);
        onComplete?.();
      }
    };

    typeNext();

    return () => clearTimeout(timer);
  }, [text, speed, onComplete]);

  return (
    <span className={`typewriter-text ${className} ${!isComplete ? 'typing' : ''}`}>
      {displayText}
      {!isComplete && <span className="typewriter-cursor">|</span>}
    </span>
  );
};

export default TypewriterText;
