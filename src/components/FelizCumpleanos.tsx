'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CONFETTI_COLORS = [
  '#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa', '#f87171', '#c084fc', '#2dd4bf',
];

function Confeti({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = `${Math.random() * 100}%`;
  const delay = Math.random() * 2;
  const duration = 2.5 + Math.random() * 2;
  const size = 6 + Math.random() * 8;
  const isRect = index % 3 !== 0;

  return (
    <motion.div
      style={{
        position: 'absolute',
        left,
        top: -20,
        width: isRect ? size : size,
        height: isRect ? size / 2 : size,
        backgroundColor: color,
        borderRadius: isRect ? 2 : '50%',
        opacity: 0.9,
      }}
      animate={{
        y: ['0%', '120vh'],
        rotate: [0, 360 * (index % 2 === 0 ? 1 : -1)],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

const EMOJIS = ['🎉', '🎂', '🎈', '🥳', '🌟', '✨', '🎁', '💜', '🎊'];

function FloatingEmoji({ emoji, index }: { emoji: string; index: number }) {
  const left = 5 + index * 11;
  const delay = index * 0.3;

  return (
    <motion.span
      style={{ position: 'absolute', left: `${left}%`, top: '10%', fontSize: '1.4rem', userSelect: 'none' }}
      animate={{
        y: [-8, 8, -8],
        rotate: [-10, 10, -10],
      }}
      transition={{
        duration: 2 + index * 0.2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {emoji}
    </motion.span>
  );
}

export default function FelizCumpleanos() {
  const [visible, setVisible] = useState(true);
  const [confettiPieces] = useState(() => Array.from({ length: 40 }, (_, i) => i));

  useEffect(() => {
    const dismissed = sessionStorage.getItem('bday_emi_dismissed');
    if (dismissed) setVisible(false);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('bday_emi_dismissed', '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-2xl shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f093fb 60%, #f5576c 100%)',
          }}
        >
          {/* Confetti lluvia */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confettiPieces.map(i => <Confeti key={i} index={i} />)}
          </div>

          {/* Brillo superior */}
          <div
            className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)',
            }}
          />

          {/* Emojis flotantes */}
          <div className="relative h-10 mt-2 pointer-events-none">
            {EMOJIS.map((emoji, i) => (
              <FloatingEmoji key={i} emoji={emoji} index={i} />
            ))}
          </div>

          {/* Contenido central */}
          <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-2 pb-6 text-center">
            {/* Cake animado */}
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [-3, 3, -3] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: '4rem', lineHeight: 1 }}
            >
              🎂
            </motion.div>

            {/* Texto principal */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-2 font-black text-white tracking-tight"
              style={{
                fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                textShadow: '0 2px 16px rgba(0,0,0,0.3)',
              }}
            >
              ¡Feliz Cumpleeeee,{' '}
              <span
                style={{
                  background: 'linear-gradient(90deg, #fff176, #ffd54f, #fff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Amor mio
              </span>
              ! 🥳
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-2 text-white/90 font-medium"
              style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)', textShadow: '0 1px 8px rgba(0,0,0,0.2)' }}
            >
              Sos una hermosa persona, hoy sera un hermoso dia ✨
            </motion.p>

            {/* Estrellas decorativas */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, type: 'spring' }}
              className="mt-3 flex items-center gap-2"
            >
              {['💜', '🌟', '💜', '🌟', '💜'].map((e, i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
                  style={{ fontSize: '1.3rem' }}
                >
                  {e}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 z-20 text-white/70 hover:text-white transition-colors rounded-full w-7 h-7 flex items-center justify-center text-xl leading-none"
            title="Cerrar"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
