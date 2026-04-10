const Lamppost = ({ x, glowDelay = 0 }: { x: string; glowDelay?: number }) => (
  <div className={`absolute bottom-[22%] md:bottom-[18%] ${x}`}>
    <svg viewBox="0 0 20 80" className="w-4 h-16 md:w-5 md:h-20">
      <rect x="8" y="20" width="4" height="60" fill="hsl(220 15% 20%)" />
      <rect x="3" y="15" width="14" height="8" rx="2" fill="hsl(220 15% 25%)" />
      <ellipse cx="10" cy="23" rx="12" ry="15" fill="hsl(45 80% 70%)" opacity="0.15" style={{
        animation: `twinkle 4s ease-in-out infinite`,
        animationDelay: `${glowDelay}s`
      }} />
      <rect x="5" y="22" width="10" height="2" fill="hsl(45 70% 65%)" opacity="0.6" />
    </svg>
  </div>
);

const BACK_BUILDINGS = [
  { x: 30, y: 120, w: 70, h: 480, fill: "hsl(225 28% 8%)" },
  { x: 110, y: 80, w: 55, h: 520, fill: "hsl(228 30% 7%)" },
  { x: 180, y: 140, w: 90, h: 460, fill: "hsl(225 25% 9%)" },
  { x: 285, y: 60, w: 65, h: 540, fill: "hsl(230 28% 7%)" },
  { x: 365, y: 130, w: 80, h: 470, fill: "hsl(225 22% 9%)" },
  { x: 460, y: 90, w: 100, h: 510, fill: "hsl(228 30% 6%)" },
  { x: 575, y: 150, w: 55, h: 450, fill: "hsl(225 25% 8%)" },
  { x: 645, y: 70, w: 85, h: 530, fill: "hsl(230 28% 7%)" },
  { x: 745, y: 110, w: 70, h: 490, fill: "hsl(225 25% 8%)" },
  { x: 830, y: 50, w: 110, h: 550, fill: "hsl(228 30% 6%)" },
  { x: 955, y: 100, w: 75, h: 500, fill: "hsl(225 28% 8%)" },
  { x: 1045, y: 140, w: 60, h: 460, fill: "hsl(230 25% 9%)" },
  { x: 1120, y: 75, w: 95, h: 525, fill: "hsl(225 28% 7%)" },
  { x: 1230, y: 130, w: 70, h: 470, fill: "hsl(228 25% 8%)" },
  { x: 1315, y: 90, w: 80, h: 510, fill: "hsl(225 22% 9%)" },
];

const ROOFTOPS: [number, number, number, number, number, number, string][] = [
  [180, 140, 225, 105, 270, 140, "hsl(225 25% 10%)"],
  [645, 70, 688, 35, 730, 70, "hsl(228 28% 8%)"],
  [830, 50, 885, 15, 940, 50, "hsl(230 30% 7%)"],
  [1120, 75, 1168, 40, 1215, 75, "hsl(225 28% 8%)"],
];

const WINDOWS: [number, number][] = [
  [45, 140], [55, 165], [45, 190], [55, 215], [45, 240], [55, 265], [45, 300], [55, 330],
  [120, 100], [132, 125], [120, 150], [132, 175], [120, 200], [132, 230],
  [200, 160], [220, 185], [240, 160], [200, 210], [220, 235], [240, 210], [200, 260], [220, 285],
  [295, 80], [310, 105], [295, 130], [310, 155], [295, 180], [310, 210], [295, 240],
  [380, 150], [400, 175], [415, 150], [380, 200], [400, 225], [415, 200], [380, 260],
  [480, 110], [500, 135], [520, 110], [480, 160], [500, 185], [520, 160], [480, 215], [500, 240], [520, 215],
  [590, 170], [605, 195], [590, 220], [605, 250],
  [660, 90], [680, 115], [700, 90], [660, 140], [680, 165], [700, 140], [660, 195], [680, 220],
  [760, 130], [775, 155], [760, 180], [775, 210], [760, 240],
  [850, 70], [870, 95], [895, 70], [910, 95], [850, 125], [870, 150], [895, 125], [910, 150], [850, 180], [870, 210],
  [970, 120], [985, 145], [970, 175], [985, 205], [970, 235],
  [1060, 160], [1075, 185], [1060, 215], [1075, 245],
  [1140, 95], [1160, 120], [1180, 95], [1140, 150], [1160, 175], [1180, 150], [1140, 210], [1160, 235],
  [1245, 150], [1260, 175], [1245, 200], [1260, 230], [1245, 260],
  [1330, 110], [1350, 135], [1370, 110], [1330, 165], [1350, 190], [1370, 165], [1330, 220],
];

const WINDOW_FILLS = [
  "hsl(45 75% 65%)", "hsl(35 55% 50%)", "hsl(200 35% 35%)", "hsl(45 60% 55%)", "hsl(210 25% 30%)",
];

const FRONT_HOUSES = [
  { x: 0, y: 400, w: 100, h: 200, peak: "0,400 50,365 100,400", fill: "hsl(225 20% 12%)", peakFill: "hsl(225 22% 14%)" },
  { x: 350, y: 410, w: 80, h: 190, peak: "350,410 390,375 430,410", fill: "hsl(228 18% 13%)", peakFill: "hsl(228 20% 15%)" },
  { x: 700, y: 395, w: 90, h: 205, peak: "700,395 745,355 790,395", fill: "hsl(225 20% 12%)", peakFill: "hsl(225 22% 14%)" },
  { x: 1050, y: 405, w: 75, h: 195, peak: "1050,405 1088,370 1125,405", fill: "hsl(230 18% 13%)", peakFill: "hsl(230 20% 15%)" },
];

const FRONT_WINDOWS: [number, number][] = [
  [20, 420], [50, 420], [20, 455], [50, 455],
  [370, 425], [400, 425], [370, 455], [400, 455],
  [720, 415], [750, 415], [720, 445], [750, 445],
  [1068, 420], [1095, 420], [1068, 452], [1095, 452],
];

const TREES: [number, number, number, number][] = [
  [60, 510, 22, 28], [150, 505, 28, 35], [280, 512, 20, 25], [430, 508, 25, 30],
  [530, 515, 18, 22], [660, 505, 30, 38], [800, 510, 24, 30], [920, 512, 20, 26],
  [1000, 507, 26, 32], [1150, 510, 22, 28], [1280, 505, 28, 35], [1400, 512, 20, 25],
];

const TREE_FILLS = ["hsl(140 30% 12%)", "hsl(150 25% 10%)", "hsl(135 28% 11%)"];
const TREE_HIGHLIGHTS = ["hsl(140 35% 15%)", "hsl(150 30% 13%)"];

const BUSHES: [number, number, number, number][] = [
  [25, 528, 18, 10], [110, 526, 22, 12], [200, 528, 16, 9], [320, 526, 20, 11],
  [470, 528, 15, 8], [580, 526, 24, 13], [730, 528, 18, 10], [850, 526, 20, 11],
  [960, 528, 16, 9], [1100, 526, 22, 12], [1220, 528, 18, 10], [1350, 526, 20, 11],
];

const BUSH_FILLS = ["hsl(145 28% 13%)", "hsl(135 25% 11%)", "hsl(155 30% 12%)"];

const STAR_POSITIONS = [
  "top-[3%] left-[8%] w-1 h-1", "top-[10%] left-[30%] w-1.5 h-1.5",
  "top-[5%] right-[25%] w-1 h-1", "top-[18%] left-[55%] w-1 h-1",
  "top-[7%] left-[70%] w-0.5 h-0.5", "top-[14%] right-[35%] w-1 h-1",
  "top-[2%] left-[50%] w-0.5 h-0.5", "top-[12%] left-[15%] w-1 h-1",
  "top-[20%] right-[15%] w-0.5 h-0.5", "top-[9%] right-[50%] w-1 h-1",
];

export function NightCityscape() {
  return (
    <>
      {/* Dark night sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(230_30%_5%)] via-[hsl(225_35%_8%)] to-[hsl(220_30%_12%)]" />

      {/* Moon */}
      <div className="absolute top-[18%] md:top-[14%] right-[10%] w-12 h-12 md:w-20 md:h-20 rounded-full bg-[hsl(45_25%_82%)] shadow-[0_0_40px_12px_hsl(45_25%_82%/0.15)]" />
      <div className="absolute top-[19.2%] md:top-[15.5%] right-[10.5%] w-2.5 h-2.5 md:w-4 md:h-4 rounded-full bg-[hsl(45_15%_72%)] opacity-25" />

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {STAR_POSITIONS.map((pos, i) => (
          <div key={i} className={`absolute rounded-full bg-white/50 ${pos}`} style={{
            animation: `twinkle 3s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`
          }} />
        ))}
      </div>

      {/* City skyline */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] md:h-[50%] pointer-events-none">
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 600" preserveAspectRatio="none">
          {/* Back row buildings */}
          {BACK_BUILDINGS.map((b, i) => (
            <rect key={`bb${i}`} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} />
          ))}

          {/* Rooftops */}
          {ROOFTOPS.map(([x1, y1, x2, y2, x3, y3, fill], i) => (
            <polygon key={`rt${i}`} points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`} fill={fill} />
          ))}

          {/* Antennas */}
          <rect x="310" y="35" width="5" height="25" fill="hsl(225 18% 12%)" />
          <circle cx="312" cy="35" r="3" fill="hsl(0 60% 45%)" opacity="0.7" style={{ animation: `twinkle 2s ease-in-out infinite` }} />
          <rect x="880" y="0" width="6" height="50" fill="hsl(225 20% 10%)" />
          <circle cx="883" cy="0" r="3" fill="hsl(0 60% 45%)" opacity="0.7" style={{ animation: `twinkle 2s ease-in-out infinite`, animationDelay: '1s' }} />
          <rect x="500" y="70" width="15" height="20" rx="2" fill="hsl(225 18% 10%)" />
          <ellipse cx="507" cy="70" rx="9" ry="6" fill="hsl(225 15% 11%)" />

          {/* Windows */}
          {WINDOWS.map(([wx, wy], i) => (
            <rect key={`w${i}`} x={wx} y={wy} width="6" height="7" rx="1"
              fill={WINDOW_FILLS[i % 5]}
              opacity={i % 3 === 0 ? 0.8 : i % 3 === 1 ? 0.5 : 0.3}
              style={i % 7 === 0 ? { animation: `twinkle 4s ease-in-out infinite`, animationDelay: `${i * 0.2}s` } : undefined}
            />
          ))}

          {/* Front row houses */}
          {FRONT_HOUSES.map((h, i) => (
            <g key={`fh${i}`}>
              <rect x={h.x} y={h.y} width={h.w} height={h.h} fill={h.fill} />
              <polygon points={h.peak} fill={h.peakFill} />
            </g>
          ))}

          {/* Front windows */}
          {FRONT_WINDOWS.map(([wx, wy], i) => (
            <rect key={`fw${i}`} x={wx} y={wy} width="8" height="10" rx="1" fill="hsl(45 70% 60%)" opacity={0.6 + (i % 3) * 0.1} />
          ))}

          {/* Front doors */}
          <rect x="38" y="470" width="16" height="24" rx="3" fill="hsl(25 40% 20%)" />
          <rect x="378" y="475" width="14" height="22" rx="3" fill="hsl(15 35% 22%)" />
          <rect x="730" y="472" width="15" height="23" rx="3" fill="hsl(20 38% 20%)" />
          <rect x="1078" y="474" width="14" height="21" rx="3" fill="hsl(25 35% 22%)" />

          {/* Ground */}
          <rect x="0" y="530" width="1440" height="12" fill="hsl(220 10% 20%)" />
          <rect x="0" y="542" width="1440" height="58" fill="hsl(220 15% 10%)" />
          {[40, 160, 280, 400, 520, 640, 760, 880, 1000, 1120, 1240, 1360].map((rx, i) => (
            <rect key={`r${i}`} x={rx} y="568" width="50" height="4" rx="2" fill="hsl(45 25% 40%)" opacity="0.35" />
          ))}
          <rect x="0" y="528" width="1440" height="3" fill="hsl(220 8% 25%)" />

          {/* Trees */}
          {TREES.map(([tx, ty, rx, ry], i) => (
            <g key={`t${i}`}>
              <rect x={tx - 3} y={ty} width="6" height={530 - ty} fill="hsl(25 20% 12%)" />
              <ellipse cx={tx} cy={ty - 5} rx={rx} ry={ry} fill={TREE_FILLS[i % 3]} />
              <ellipse cx={tx - 4} cy={ty - 10} rx={rx * 0.7} ry={ry * 0.6} fill={TREE_HIGHLIGHTS[i % 2]} />
            </g>
          ))}

          {/* Bushes */}
          {BUSHES.map(([bx, by, rx, ry], i) => (
            <ellipse key={`b${i}`} cx={bx} cy={by} rx={rx} ry={ry} fill={BUSH_FILLS[i % 3]} />
          ))}

          {/* Ivy */}
          {[110, 465, 835, 1230].map((ix, i) => (
            <g key={`ivy${i}`}>
              <ellipse cx={ix + 5} cy={280 + i * 15} rx="12" ry="18" fill="hsl(140 30% 12%)" opacity="0.6" />
              <ellipse cx={ix - 3} cy={310 + i * 10} rx="10" ry="15" fill="hsl(150 25% 10%)" opacity="0.5" />
              <ellipse cx={ix + 8} cy={340 + i * 8} rx="14" ry="20" fill="hsl(145 28% 11%)" opacity="0.55" />
            </g>
          ))}

          {/* Park benches */}
          {[240, 1180].map((bx) => (
            <g key={`bench${bx}`}>
              <rect x={bx} y="520" width="30" height="3" rx="1" fill="hsl(25 20% 15%)" />
              <rect x={bx + 3} y="523" width="3" height="7" fill="hsl(25 18% 12%)" />
              <rect x={bx + 24} y="523" width="3" height="7" fill="hsl(25 18% 12%)" />
              <rect x={bx} y="515" width="3" height="8" fill="hsl(25 18% 12%)" />
              <rect x={bx + 27} y="515" width="3" height="8" fill="hsl(25 18% 12%)" />
            </g>
          ))}

          {/* Flower boxes */}
          {[15, 45, 365, 395, 715, 745, 1063, 1090].map((fx, i) => (
            <g key={`fb${i}`}>
              <rect x={fx} y={435 + (i % 4) * 2} width="12" height="4" rx="1" fill="hsl(25 30% 18%)" />
              <circle cx={fx + 3} cy={433 + (i % 4) * 2} r="2.5" fill={i % 3 === 0 ? "hsl(340 50% 35%)" : i % 3 === 1 ? "hsl(50 50% 40%)" : "hsl(280 40% 35%)"} opacity="0.6" />
              <circle cx={fx + 9} cy={433 + (i % 4) * 2} r="2" fill={i % 2 === 0 ? "hsl(350 45% 38%)" : "hsl(45 55% 42%)"} opacity="0.5" />
            </g>
          ))}
        </svg>
      </div>

      {/* Lampposts */}
      <div className="hidden sm:block">
        <Lamppost x="left-[7%]" glowDelay={0} />
        <Lamppost x="left-[25%]" glowDelay={1} />
        <Lamppost x="left-[50%]" glowDelay={2} />
        <Lamppost x="right-[25%]" glowDelay={1.5} />
        <Lamppost x="right-[8%]" glowDelay={3} />
      </div>

      {/* Text readability overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(230_30%_5%/0.85)] via-[hsl(230_30%_5%/0.3)] to-transparent pointer-events-none z-[5]" />
    </>
  );
}
