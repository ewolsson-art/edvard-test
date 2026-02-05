import { useMemo } from 'react';

interface FloatingElement {
  id: number;
  type: 'circle' | 'ring' | 'dot' | 'wave' | 'plus';
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  color: string;
}

const COLORS = [
  'hsl(210 25% 45%)',   // primary blue-gray
  'hsl(160 84% 39%)',   // mood-stable green
  'hsl(45 80% 55%)',    // warm gold
  'hsl(220 60% 55%)',   // blue
  'hsl(350 55% 65%)',   // soft pink
  'hsl(38 92% 50%)',    // amber
];

export function AnimatedMoodBackground() {
  const elements = useMemo(() => {
    const els: FloatingElement[] = [];
    const types: FloatingElement['type'][] = ['circle', 'ring', 'dot', 'wave', 'plus'];

    for (let i = 0; i < 28; i++) {
      els.push({
        id: i,
        type: types[i % types.length],
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 8 + Math.random() * 40,
        delay: Math.random() * 8,
        duration: 12 + Math.random() * 18,
        opacity: 0.06 + Math.random() * 0.12,
        color: COLORS[i % COLORS.length],
      });
    }
    return els;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Soft gradient orbs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] animate-mood-float-1"
        style={{
          background: 'radial-gradient(circle, hsl(210 30% 50% / 0.12), transparent 70%)',
          top: '-10%',
          left: '-5%',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full blur-[100px] animate-mood-float-2"
        style={{
          background: 'radial-gradient(circle, hsl(160 60% 40% / 0.1), transparent 70%)',
          bottom: '5%',
          right: '-5%',
        }}
      />
      <div
        className="absolute w-[350px] h-[350px] rounded-full blur-[90px] animate-mood-float-3"
        style={{
          background: 'radial-gradient(circle, hsl(45 70% 55% / 0.08), transparent 70%)',
          top: '30%',
          right: '20%',
        }}
      />

      {/* Floating SVG elements */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {elements.map((el) => (
          <g
            key={el.id}
            className="animate-mood-element"
            style={{
              animationDelay: `${el.delay}s`,
              animationDuration: `${el.duration}s`,
            }}
          >
            {el.type === 'circle' && (
              <circle
                cx={`${el.x}%`}
                cy={`${el.y}%`}
                r={el.size / 2}
                fill={el.color}
                opacity={el.opacity}
              />
            )}
            {el.type === 'ring' && (
              <circle
                cx={`${el.x}%`}
                cy={`${el.y}%`}
                r={el.size / 2}
                fill="none"
                stroke={el.color}
                strokeWidth="1.5"
                opacity={el.opacity}
              />
            )}
            {el.type === 'dot' && (
              <circle
                cx={`${el.x}%`}
                cy={`${el.y}%`}
                r={el.size / 5}
                fill={el.color}
                opacity={el.opacity * 1.5}
              />
            )}
            {el.type === 'wave' && (
              <path
                d={`M${el.x - 2}% ${el.y}% Q${el.x}% ${el.y - 1.5}% ${el.x + 2}% ${el.y}% Q${el.x + 4}% ${el.y + 1.5}% ${el.x + 6}% ${el.y}%`}
                fill="none"
                stroke={el.color}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity={el.opacity * 1.2}
              />
            )}
            {el.type === 'plus' && (
              <g opacity={el.opacity * 1.3}>
                <line
                  x1={`${el.x}%`} y1={`${el.y - 0.8}%`}
                  x2={`${el.x}%`} y2={`${el.y + 0.8}%`}
                  stroke={el.color} strokeWidth="1.5" strokeLinecap="round"
                />
                <line
                  x1={`${el.x - 0.6}%`} y1={`${el.y}%`}
                  x2={`${el.x + 0.6}%`} y2={`${el.y}%`}
                  stroke={el.color} strokeWidth="1.5" strokeLinecap="round"
                />
              </g>
            )}
          </g>
        ))}

        {/* Pulse line - like a heartbeat / mood graph */}
        <path
          d="M0 55% Q5% 55% 10% 55% L15% 45% L18% 60% L21% 40% L24% 55% Q40% 55% 50% 55% L55% 48% L58% 58% L61% 42% L64% 55% Q80% 55% 100% 55%"
          fill="none"
          stroke="hsl(160 60% 45%)"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.08"
          className="animate-mood-pulse-line"
        />
        <path
          d="M0 65% Q8% 65% 16% 65% L20% 58% L23% 68% L26% 56% L29% 65% Q50% 65% 70% 65% L74% 58% L77% 70% L80% 55% L83% 65% Q92% 65% 100% 65%"
          fill="none"
          stroke="hsl(210 30% 50%)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.06"
          className="animate-mood-pulse-line-2"
        />
      </svg>

      {/* Floating mood emoji-like dots along bottom */}
      <div className="absolute bottom-[15%] left-0 right-0 flex justify-around px-12 opacity-[0.07]">
        {['hsl(160 70% 45%)', 'hsl(45 80% 55%)', 'hsl(210 40% 55%)', 'hsl(350 50% 60%)', 'hsl(38 85% 50%)'].map((color, i) => (
          <div
            key={i}
            className="rounded-full animate-mood-bob"
            style={{
              width: 12 + i * 4,
              height: 12 + i * 4,
              backgroundColor: color,
              animationDelay: `${i * 1.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
