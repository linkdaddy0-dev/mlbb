import React, { useState, useEffect } from 'react';

// Sleek SVG vectors to use as elegant, fallback assets if offline or failed
const FALLBACK_VECTORS = {
  hero: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/><circle cx='12' cy='11' r='3'/></svg>", // Premium inline vector shield
  skill: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><path d='m12 8-4 4 4 4 4-4-4-4z'/></svg>",
  item: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fbbf24' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/></svg>",
  spell: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polygon points='5 3 19 12 5 21 5 3'/></svg>"
};

export default function SmartImage({ src, alt, className, style, imgStyle, fallbackType = 'hero', onLoad }) {
  const [imgSrc, setImgSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Whenever source changes, load local asset directly (zero runtime proxying allowed!)
    setImgSrc(src);
    setLoading(true);
    setError(false);
    setRetryCount(0);
  }, [src]);

  const handleLoad = (e) => {
    setLoading(false);
    setError(false);
    if (onLoad) {
      onLoad(e);
    }
  };

  const handleError = () => {
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      const delay = (retryCount + 1) * 1000;
      setTimeout(() => {
        setImgSrc(src);
      }, delay);
    } else {
      console.warn(`SmartImage failed to load: ${src}. Applying local offline fallback.`);
      setLoading(false);
      setError(true);
      setImgSrc(FALLBACK_VECTORS[fallbackType] || FALLBACK_VECTORS.hero);
    }
  };

  return (
    <div 
      style={{ 
        position: 'relative', 
        display: 'inline-block', 
        width: className ? undefined : '100%', 
        height: className ? undefined : '100%', 
        overflow: 'hidden',
        ...style 
      }} 
      className={className}
    >
      {/* Premium Skeleton Pulse Loading Overlay */}
      {loading && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
            borderRadius: 'inherit',
            zIndex: 2
          }}
        />
      )}
      
      {/* Local Asset Image */}
      <img
        src={imgSrc || FALLBACK_VECTORS[fallbackType]}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        referrerPolicy="no-referrer"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.25s ease-in-out',
          borderRadius: 'inherit',
          ...imgStyle
        }}
      />
    </div>
  );
}
