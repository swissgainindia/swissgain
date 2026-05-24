import React, { useEffect, useRef } from "react";

const Ticker: React.FC = () => {
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tickerRef.current) {
      // Duplicate content for seamless scrolling
      tickerRef.current.innerHTML += tickerRef.current.innerHTML;
    }
  }, []);

  return (
    <div className="top-header">
      <div className="ticker">
        <div className="ticker-content" ref={tickerRef}>
          <span>
            <img
              src="https://brown-wolf-538857.hostingersite.com/wp-content/uploads/2025/06/banner.png"
              alt="Gold Necklaces"
            />
            GOLD NECKLACES
          </span>
          <span>
            <img
              src="https://brown-wolf-538857.hostingersite.com/wp-content/uploads/2025/06/banner-1.png"
              alt="Diamond Rings"
            />
            DIAMOND RINGS
          </span>
          <span>
            <img
              src="https://brown-wolf-538857.hostingersite.com/wp-content/uploads/2025/06/banner-2.png"
              alt="Silver Bracelets"
            />
            SILVER BRACELETS
          </span>
          <span>
            <img
              src="https://brown-wolf-538857.hostingersite.com/wp-content/uploads/2025/06/banner-3-scaled.png"
              alt="Pearl Earrings"
            />
            PEARL EARRINGS
          </span>
          <span>
            <img
              src="https://brown-wolf-538857.hostingersite.com/wp-content/uploads/2025/06/banner-4.png"
              alt="Luxury Pendants"
            />
            LUXURY PENDANTS
          </span>
        </div>
      </div>

      <style jsx>{`
        .top-header {
          overflow: hidden;
          white-space: nowrap;
          padding: 10px 0;
        }

        .ticker {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .ticker-content {
          display: inline-block;
          white-space: nowrap;
          animation: scroll-left 20s linear infinite;
        }

        .ticker-content span {
          display: inline-flex;
          align-items: center;
          padding: 0 40px;
          font-size: 26px;
          font-weight: bold;
          color: #2a0303;
        }

        .ticker-content img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 10px;
          margin-right: -10px;
        }

        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

export default Ticker;
