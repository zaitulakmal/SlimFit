/**
 * Cute food characters — chunky round food buddies used as section icons and
 * decorations on the Home / Food Log screens. Each is pure SVG (no deps) and
 * scalable by `size`.
 */
import Svg, { Circle, Ellipse, Path, Defs, LinearGradient, Stop, G, Rect } from 'react-native-svg';
import { withAlpha } from '@/theme/cute';

type P = { size?: number };

export function FoodApple({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="appleG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FF9AA8" />
          <Stop offset="100%" stopColor="#FF6B8A" />
        </LinearGradient>
      </Defs>
      <Path d="M32,18 C20,14 10,22 10,36 C10,50 22,58 32,58 C42,58 54,50 54,36 C54,22 44,14 32,18 Z" fill="url(#appleG)" />
      <Ellipse cx={26} cy={30} rx={5} ry={7} fill={withAlpha('#FFFFFF', 0.45)} />
      <Path d="M32,18 Q33,10 40,9" stroke="#34C6A0" strokeWidth={3} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function FoodBroccoli({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="brocG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#7BE0B8" />
          <Stop offset="100%" stopColor="#34C6A0" />
        </LinearGradient>
      </Defs>
      <Rect x={26} y={34} width={12} height={22} rx={6} fill="#C9B79C" />
      <Circle cx={24} cy={26} r={13} fill="url(#brocG)" />
      <Circle cx={40} cy={26} r={13} fill="url(#brocG)" />
      <Circle cx={32} cy={20} r={14} fill="url(#brocG)" />
      <Circle cx={27} cy={23} r={3} fill={withAlpha('#FFFFFF', 0.5)} />
      <Circle cx={37} cy={22} r={3} fill={withAlpha('#FFFFFF', 0.5)} />
    </Svg>
  );
}

export function FoodEgg({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M32,8 C44,8 52,28 52,40 C52,52 43,58 32,58 C21,58 12,52 12,40 C12,28 20,8 32,8 Z" fill="#FFFFFF" />
      <Circle cx={32} cy={36} r={14} fill="#FFC53D" />
      <Circle cx={27} cy={31} r={4} fill={withAlpha('#FFFFFF', 0.55)} />
    </Svg>
  );
}

export function FoodWater({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="dropG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#9BE0FB" />
          <Stop offset="100%" stopColor="#5BC8F4" />
        </LinearGradient>
      </Defs>
      <Path d="M32,8 C20,28 14,38 14,44 A18,18 0 0 0 50,44 C50,38 44,28 32,8 Z" fill="url(#dropG)" />
      <Ellipse cx={26} cy={40} rx={5} ry={7} fill={withAlpha('#FFFFFF', 0.55)} />
    </Svg>
  );
}

export function FoodCarrot({ size = 64 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="carG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFB45B" />
          <Stop offset="100%" stopColor="#FF8A3D" />
        </LinearGradient>
      </Defs>
      <Path d="M32,22 L46,58 Q32,64 18,58 Z" fill="url(#carG)" />
      <Path d="M28,18 Q24,8 18,8 Q24,14 26,20" fill="#5BD6B4" />
      <Path d="M32,16 Q32,4 32,4 Q36,12 34,20" fill="#34C6A0" />
      <Path d="M36,18 Q42,10 48,10 Q40,16 38,20" fill="#5BD6B4" />
    </Svg>
  );
}

/** A floating decorative blob used as background texture. */
export function Blob({
  size = 120,
  color = '#FF8FA3',
  opacity = 0.18,
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" style={{ position: 'absolute' }}>
      <Path
        d="M60,8 C84,8 106,22 110,48 C114,74 98,100 72,110 C46,120 18,106 10,80 C2,54 14,26 38,16 C44,13 52,8 60,8 Z"
        fill={color}
        opacity={opacity}
      />
    </Svg>
  );
}

/** A small star/sparkle. */
export function Sparkle({ size = 24, color = '#FFE09A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12,2 C13,8 16,11 22,12 C16,13 13,16 12,22 C11,16 8,13 2,12 C8,11 11,8 12,2 Z"
        fill={color}
      />
    </Svg>
  );
}
