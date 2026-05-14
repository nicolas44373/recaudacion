'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SPARKLE_POSITIONS = [
  { x: 5,  y: 10, s: '1.4rem', d: '0s',    dur: '3s' },
  { x: 18, y: 70, s: '1.0rem', d: '0.4s',  dur: '2.8s' },
  { x: 30, y: 20, s: '1.6rem', d: '0.8s',  dur: '3.2s' },
  { x: 48, y: 75, s: '1.1rem', d: '1.2s',  dur: '2.6s' },
  { x: 62, y: 15, s: '1.5rem', d: '0.3s',  dur: '3.4s' },
  { x: 75, y: 65, s: '1.0rem', d: '0.9s',  dur: '2.5s' },
  { x: 88, y: 25, s: '1.3rem', d: '1.5s',  dur: '3.1s' },
  { x: 92, y: 80, s: '1.6rem', d: '0.6s',  dur: '2.9s' },
  { x: 10, y: 50, s: '1.2rem', d: '1.8s',  dur: '3.3s' },
  { x: 55, y: 45, s: '1.4rem', d: '0.2s',  dur: '2.7s' },
  { x: 82, y: 50, s: '1.1rem', d: '1.1s',  dur: '3.0s' },
  { x: 38, y: 88, s: '1.3rem', d: '0.7s',  dur: '2.4s' },
];

const SPARKLE_EMOJIS = ['✨', '🌸', '🌟', '💛', '🌹', '💗', '⭐', '💎', '🌷', '💫', '🌸', '✨'];

export default function FelizCumpleanos() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('bday_emi_dismissed');
    if (dismissed) setVisible(false);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('bday_emi_dismissed', '1');
    setVisible(false);
  };

  return (
    <>
      <style>{`
        @keyframes bday-float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.7; }
          50% { transform: translateY(-14px) scale(1.2); opacity: 1; }
        }
        @keyframes bday-crown {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
        @keyframes bday-shimmer {
          0% { left: -50%; }
          100% { left: 130%; }
        }
        @keyframes bday-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.4), inset 0 0 20px rgba(255,215,0,0.05); }
          50% { box-shadow: 0 0 50px rgba(255,215,0,0.8), inset 0 0 40px rgba(255,215,0,0.1); }
        }
        @keyframes bday-name {
          0%, 100% { filter: drop-shadow(0 0 16px rgba(255,215,0,0.6)); }
          50% { filter: drop-shadow(0 0 36px rgba(255,215,0,1)) drop-shadow(0 0 60px rgba(255,105,180,0.6)); }
        }
        @keyframes bday-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.2); }
        }
      `}</style>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: [0.34, 1.4, 0.64, 1] }}
            className="relative overflow-hidden rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, #2d0018 0%, #7b0035 22%, #c2185b 48%, #d4156a 65%, #8b4a0a 82%, #b8860b 100%)',
              border: '2px solid rgba(255,215,0,0.6)',
              animation: 'bday-glow 3s ease-in-out infinite',
            }}
          >
            {/* Shimmer sweep — CSS only */}
            <div
              style={{
                position: 'absolute', top: 0, bottom: 0, width: '40%',
                background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.13), rgba(255,255,255,0.07), transparent)',
                pointerEvents: 'none', zIndex: 3,
                animation: 'bday-shimmer 4s linear infinite',
                animationDelay: '1s',
              }}
            />

            {/* Fixed sparkle particles — CSS only, no JS random */}
            {SPARKLE_POSITIONS.map((sp, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${sp.x}%`, top: `${sp.y}%`,
                  fontSize: sp.s,
                  pointerEvents: 'none', zIndex: 1,
                  animation: `bday-float ${sp.dur} ease-in-out infinite`,
                  animationDelay: sp.d,
                }}
              >
                {SPARKLE_EMOJIS[i]}
              </div>
            ))}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center px-6 py-10 text-center">

              {/* Crown */}
              <div style={{ fontSize: '3.5rem', animation: 'bday-crown 2.5s ease-in-out infinite', filter: 'drop-shadow(0 0 14px rgba(255,215,0,0.9))' }}>
                👑
              </div>

              {/* Label */}
              <p style={{
                color: '#FFD700',
                fontSize: 'clamp(0.6rem, 1.8vw, 0.82rem)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.32em',
                textShadow: '0 0 16px rgba(255,215,0,0.9)',
                marginTop: '0.5rem',
              }}>
                ✦ Feliz Cumpleeeeee ✦
              </p>

              {/* Name */}
              <div style={{ marginTop: '0.25rem', lineHeight: 1, animation: 'bday-name 2.5s ease-in-out infinite' }}>
                <span style={{
                  display: 'block',
                  fontSize: 'clamp(4rem, 11vw, 6.5rem)',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  background: 'linear-gradient(135deg, #FFE566 0%, #FFF8DC 22%, #FFD700 45%, #FFB347 65%, #FF69B4 82%, #FFD700 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Mi Amorrrr
                </span>
              </div>

              {/* Flowers */}
              <div style={{ fontSize: 'clamp(1.3rem, 3.5vw, 1.9rem)', marginTop: '0.6rem', display: 'flex', gap: '4px' }}>
                {['🌹', '🌸', '✨', '💛', '✨', '🌸', '🌹'].map((e, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      animation: `bday-bounce 1.8s ease-in-out infinite`,
                      animationDelay: `${i * 0.18}s`,
                    }}
                  >
                    {e}
                  </span>
                ))}
              </div>

              {/* Message */}
              <p style={{
                marginTop: '0.9rem',
                fontSize: 'clamp(0.88rem, 2vw, 1.05rem)',
                color: 'rgba(255, 240, 210, 0.95)',
                textShadow: '0 1px 10px rgba(0,0,0,0.6)',
                maxWidth: 500,
                lineHeight: 1.6,
                fontWeight: 500,
              }}>
                Sos una hermosa persona, hoy será un hermoso día ✨
              </p>

              {/* Diamonds */}
              <div style={{ marginTop: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                {['💎', '🌹', '💗', '⭐', '💗', '🌹', '💎'].map((e, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
                      display: 'inline-block',
                      animation: `bday-bounce 1.4s ease-in-out infinite`,
                      animationDelay: `${i * 0.14}s`,
                    }}
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={dismiss}
              title="Cerrar"
              style={{
                position: 'absolute', top: '0.9rem', right: '0.9rem', zIndex: 20,
                color: 'rgba(255,215,0,0.65)', fontSize: '1.5rem', lineHeight: 1,
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
              }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
