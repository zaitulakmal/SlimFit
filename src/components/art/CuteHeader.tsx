/**
 * CuteHeader — a shared, multi-colour pastel hero decoration used at the top
 * of every screen. Coral → butter → mint → sky blobs + a soft wavy bottom that
 * melts into the cream page background. Pure SVG, no deps.
 *
 * It is absolutely positioned and full-bleed: it always spans the whole window
 * width, so it stays edge-to-edge even when the parent has horizontal padding
 * (a percentage width would resolve against the parent's *content* box and
 * leave a gap on the right).
 */
import { useWindowDimensions } from 'react-native';
import Svg, { Rect, Path, Circle as SvgCircle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { cute, cuteHeaderStops } from '@/theme/cute';

export function CuteHeader({
  height = 200,
  bottomColor = cute.cream,
  width,
}: {
  height?: number;
  bottomColor?: string;
  /** Override the full-bleed width (defaults to the window width). */
  width?: number;
}) {
  const { width: winW } = useWindowDimensions();
  const w = width ?? winW;
  const gid = 'cuteHeaderGrad';

  return (
    <Svg
      width={w}
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      <Defs>
        <LinearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          {cuteHeaderStops.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </LinearGradient>
      </Defs>

      <Rect width={w} height={height} fill={`url(#${gid})`} opacity={0.92} />

      {/* soft floating blobs — each a different brand hue */}
      <SvgCircle cx={w * 0.85} cy={-10} r={90} fill={cute.butter} opacity={0.35} />
      <SvgCircle cx={w * 0.08} cy={height + 10} r={70} fill={cute.mint} opacity={0.3} />
      <SvgCircle cx={w * 0.92} cy={height * 0.6} r={26} fill="#FFFFFF" opacity={0.25} />
      <SvgCircle cx={w * 0.07} cy={height * 0.35} r={14} fill="#FFFFFF" opacity={0.3} />
      <SvgCircle cx={w * 0.51} cy={-20} r={40} fill={cute.sky} opacity={0.22} />

      {/* wavy bottom into the page colour */}
      <Path
        d={`M0,${height - 26} Q${w * 0.25},${height - 8} ${w * 0.5},${height - 20} Q${w * 0.75},${height - 32} ${w},${height - 14} L${w},${height} L0,${height} Z`}
        fill={bottomColor}
      />
    </Svg>
  );
}
