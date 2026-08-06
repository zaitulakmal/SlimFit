/**
 * PetalDonut — the signature "health score" ring from the reference design:
 * a circular chart built from segmented pastel arcs (petal / sun-ray style)
 * with the score in the center. Each arc is one health system.
 *
 * Pure SVG (react-native-svg). Deterministic, no animation needed.
 */
import Svg, { Circle as SvgCircle, G, Path } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';
import { cute } from '@/theme/cute';
import type { SystemScore } from '@/services/healthScore';

interface Props {
  score: number; // 0..10
  systems: SystemScore[];
  size?: number;
}

const TAU = Math.PI * 2;
// tiny radius wobble per segment gives the organic "petal" feel
const PETAL_WOBBLE = [0, 6, 3, 7, 2, 5, 1, 4];

export function PetalDonut({ score, systems, size = 240 }: Props) {
  const c = size / 2;
  const baseR = size * 0.36;
  const stroke = size * 0.10;
  const n = systems.length;
  const gap = 0.04; // radians between segments
  const seg = TAU / n;

  let start = -Math.PI / 2 + gap / 2;

  const arcs = systems.map((s, i) => {
    const a0 = start;
    const a1 = start + seg - gap;
    const wob = PETAL_WOBBLE[i % PETAL_WOBBLE.length];
    const rOuter = baseR + stroke / 2 + wob;
    const rInner = baseR - stroke / 2;
    const d = arcPath(c, c, rOuter, rInner, a0, a1);
    start += seg;
    return <Path key={s.key} d={d} fill={s.accent} />;
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* faint track ring so it reads as a donut even with few segments */}
        <G>
          {arcs}
        </G>
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.score, { color: cute.ink }]}>{score.toFixed(1)}</Text>
        <Text style={styles.label}>health score</Text>
      </View>
    </View>
  );
}

function arcPath(cx: number, cy: number, rO: number, rI: number, a0: number, a1: number): string {
  const x0o = cx + rO * Math.cos(a0);
  const y0o = cy + rO * Math.sin(a0);
  const x1o = cx + rO * Math.cos(a1);
  const y1o = cy + rO * Math.sin(a1);
  const x0i = cx + rI * Math.cos(a1);
  const y0i = cy + rI * Math.sin(a1);
  const x1i = cx + rI * Math.cos(a0);
  const y1i = cy + rI * Math.sin(a0);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return [
    `M ${x0o} ${y0o}`,
    `A ${rO} ${rO} 0 ${large} 1 ${x1o} ${y1o}`,
    `L ${x0i} ${y0i}`,
    `A ${rI} ${rI} 0 ${large} 0 ${x1i} ${y1i}`,
    'Z',
  ].join(' ');
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  score: { fontSize: 44, fontWeight: '800', letterSpacing: -1.5, lineHeight: 48 },
  label: { fontSize: 13, fontWeight: '600', color: cute.inkSoft, marginTop: -2 },
});
