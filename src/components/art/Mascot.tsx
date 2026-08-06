/**
 * Mascot — "Berry", the Slimora buddy.
 * A cute round strawberry/berry character with a face, leaf crown and tiny arms.
 * Pure SVG so it renders everywhere; used directly as the 2D fallback for the
 * 3D mascot and as decoration on empty states / headers.
 */
import Svg, { Circle, Ellipse, Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { withAlpha } from '@/theme/cute';

export type Mood = 'happy' | 'cheer' | 'wave' | 'sleep' | 'think';

interface Props {
  size?: number;
  mood?: Mood;
  color?: string; // body fill override
}

export function Mascot({ size = 140, mood = 'happy', color = '#FF8FA3' }: Props) {
  const leaf = '#5BD6B4';
  const leafDeep = '#34C6A0';
  const cheek = withAlpha('#FF6B8A', 0.45);

  // Eyes differ by mood
  const Eye = ({ x }: { x: number }) => {
    if (mood === 'sleep') {
      return (
        <Path
          d={`M${x - 7},${74} Q${x},${79} ${x + 7},${74}`}
          stroke={cuteInk}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
      );
    }
    return (
      <G>
        <Circle cx={x} cy={72} r={7.5} fill={cuteInk} />
        <Circle cx={x + 2.5} cy={69.5} r={2.6} fill="#FFFFFF" />
      </G>
    );
  };

  // Mouth differs by mood
  const Mouth = () => {
    if (mood === 'cheer')
      return <Path d="M64,84 Q82,104 100,84 Q82,94 64,84 Z" fill={cuteInk} />;
    if (mood === 'sleep')
      return <Path d={`M72,86 Q82,93 92,86`} stroke={cuteInk} strokeWidth={3} fill="none" strokeLinecap="round" />;
    if (mood === 'think')
      return <Path d={`M70,88 Q82,96 94,88`} stroke={cuteInk} strokeWidth={3} fill="none" strokeLinecap="round" />;
    // happy
    return <Path d={`M66,84 Q82,98 98,84`} stroke={cuteInk} strokeWidth={3.4} fill="none" strokeLinecap="round" />;
  };

  const armUp = mood === 'cheer' || mood === 'wave';

  return (
    <Svg width={size} height={size} viewBox="0 0 164 164">
      <Defs>
        <LinearGradient id="berryBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFB1A8" />
          <Stop offset="100%" stopColor={color} />
        </LinearGradient>
        <LinearGradient id="berryLeaf" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={leaf} />
          <Stop offset="100%" stopColor={leafDeep} />
        </LinearGradient>
      </Defs>

      {/* soft shadow */}
      <Ellipse cx={82} cy={154} rx={42} ry={8} fill={withAlpha('#C98B86', 0.18)} />

      {/* arms */}
      {armUp ? (
        <Path d="M40,96 Q22,84 30,66" stroke={color} strokeWidth={11} strokeLinecap="round" fill="none" />
      ) : (
        <Path d="M40,104 Q26,112 30,124" stroke={color} strokeWidth={11} strokeLinecap="round" fill="none" />
      )}
      <Path d="M124,104 Q138,112 134,124" stroke={color} strokeWidth={11} strokeLinecap="round" fill="none" />

      {/* body */}
      <Path
        d="M82,40
           C118,40 138,66 138,98
           C138,128 112,150 82,150
           C52,150 26,128 26,98
           C26,66 46,40 82,40 Z"
        fill="url(#berryBody)"
      />
      {/* seeds */}
      <Ellipse cx={62} cy={96} rx={2.4} ry={3.6} fill={withAlpha('#FFFFFF', 0.6)} />
      <Ellipse cx={92} cy={92} rx={2.4} ry={3.6} fill={withAlpha('#FFFFFF', 0.6)} />
      <Ellipse cx={76} cy={118} rx={2.4} ry={3.6} fill={withAlpha('#FFFFFF', 0.6)} />
      <Ellipse cx={102} cy={116} rx={2.4} ry={3.6} fill={withAlpha('#FFFFFF', 0.6)} />
      <Ellipse cx={82} cy={132} rx={2.4} ry={3.6} fill={withAlpha('#FFFFFF', 0.6)} />

      {/* cheeks */}
      <Circle cx={56} cy={86} r={9} fill={cheek} />
      <Circle cx={108} cy={86} r={9} fill={cheek} />

      {/* eyes + mouth */}
      <Eye x={66} />
      <Eye x={98} />
      <Mouth />

      {/* leaf crown */}
      <G>
        <Path d="M82,40 Q70,18 52,22 Q70,30 74,42 Z" fill="url(#berryLeaf)" />
        <Path d="M82,40 Q94,18 112,22 Q94,30 90,42 Z" fill="url(#berryLeaf)" />
        <Path d="M82,42 Q82,16 82,8 Q92,20 86,42 Z" fill={leaf} />
        <Circle cx={82} cy={40} r={5} fill={leafDeep} />
      </G>

      {mood === 'sleep' && (
        <G opacity={0.8} fill="none" stroke={cuteInk} strokeWidth={2.4} strokeLinecap="round">
          <Path d="M120,40 Q126,32 132,40 Q126,48 120,40 Z" fill={withAlpha('#3D2C3E', 0.0)} />
          <Path d="M126,34 q6,-8 12,0" />
          <Path d="M132,28 q6,-8 12,0" />
        </G>
      )}
    </Svg>
  );
}

const cuteInk = '#3D2C3E';
