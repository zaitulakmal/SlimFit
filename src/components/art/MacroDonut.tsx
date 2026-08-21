/**
 * MacroDonut — the hero calorie ring.
 *
 * How much of the ring is filled = how much of today's calorie budget has been
 * eaten. How that filled arc is *divided* = where those calories came from,
 * so protein / carbs / fat each take an angular share proportional to the
 * energy they contributed (4 kcal per gram of protein and carbs, 9 for fat).
 *
 * Segment angles come from the macro split, but the total sweep is pinned to
 * the calorie fill — logged foods carry their own kcal value which rarely
 * matches 4/4/9 exactly, and the ring should stay honest about calories.
 *
 * Pure SVG (react-native-svg), no animation.
 */
import Svg, { G, Path, Circle as SvgCircle } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';
import { cute, withAlpha } from '@/theme/cute';

export interface MacroSlice {
  key: string;
  label: string;
  grams: number;
  /** 4 for protein/carbs, 9 for fat */
  kcalPerGram: number;
  accent: string;
}

interface Props {
  /** kcal eaten today */
  consumed: number;
  /** kcal target for today, including anything earned from exercise */
  budget: number;
  macros: MacroSlice[];
  size?: number;
}

const TAU = Math.PI * 2;
// A tiny per-segment radius wobble keeps the soft "petal" feel of the design.
// It only moves the outer radius, never the angles, so the split stays accurate.
const WOBBLE = [0, 5, 2.5];

export function MacroDonut({ consumed, budget, macros, size = 230 }: Props) {
  const c = size / 2;
  const baseR = size * 0.36;
  const stroke = size * 0.1;
  const rInner = baseR - stroke / 2;

  const budgetSafe = budget > 0 ? budget : Math.max(consumed, 1);
  const over = consumed > budgetSafe;
  const fill = Math.min(consumed / budgetSafe, 1);
  const remaining = Math.max(Math.round(budgetSafe - consumed), 0);
  const overBy = Math.max(Math.round(consumed - budgetSafe), 0);

  const kcals = macros.map((m) => Math.max(Number(m.grams) || 0, 0) * m.kcalPerGram);
  const kcalSum = kcals.reduce((a, b) => a + b, 0);

  const sweep = fill * TAU;
  const gap = sweep > 0.6 ? 0.05 : 0; // no gaps once slices get thin

  let angle = -Math.PI / 2;
  const arcs: React.ReactNode[] = [];

  if (sweep > 0.001) {
    if (kcalSum > 0) {
      macros.forEach((m, i) => {
        const share = kcals[i] / kcalSum;
        const span = sweep * share;
        if (span <= 0.001) return;
        const a0 = angle;
        const a1 = angle + Math.max(span - gap, span * 0.35);
        const rOuter = baseR + stroke / 2 + WOBBLE[i % WOBBLE.length];
        arcs.push(<Path key={m.key} d={arcPath(c, c, rOuter, rInner, a0, a1)} fill={m.accent} />);
        angle += span;
      });
    } else {
      // Calories logged without a macro breakdown — one neutral arc.
      arcs.push(
        <Path
          key="unsplit"
          d={arcPath(c, c, baseR + stroke / 2, rInner, angle, angle + sweep)}
          fill={withAlpha(cute.coral, 0.55)}
        />
      );
    }
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          {/* unfilled budget */}
          <SvgCircle
            cx={c}
            cy={c}
            r={baseR}
            stroke={over ? withAlpha(cute.danger, 0.18) : cute.line}
            strokeWidth={stroke}
            fill="none"
          />
          <G>{arcs}</G>
        </Svg>
        <View style={styles.center}>
          <Text style={[styles.value, { color: over ? cute.danger : cute.ink }]} numberOfLines={1}>
            {over ? `+${overBy.toLocaleString()}` : remaining.toLocaleString()}
          </Text>
          <Text style={styles.label}>{over ? 'kcal over' : 'kcal left'}</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {macros.map((m) => (
          <View key={m.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: m.accent }]} />
            <Text style={styles.legendLabel}>{m.label}</Text>
            <Text style={[styles.legendValue, { color: m.accent }]}>
              {Math.round(Number(m.grams) || 0)}g
            </Text>
          </View>
        ))}
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
  value: { fontSize: 44, fontWeight: '800', letterSpacing: -1.5, lineHeight: 48 },
  label: { fontSize: 13, fontWeight: '600', color: cute.inkSoft, marginTop: -2 },

  legend: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, fontWeight: '600', color: cute.inkSoft },
  legendValue: { fontSize: 12, fontWeight: '800' },
});
