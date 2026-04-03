/**
 * Weight Screen — Duolingo-style redesign
 * Clean weight tracking with animated chart and progress
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Layout,
} from 'react-native-reanimated';
import { CheckCircle, ArrowRight, Trash, Scales, TrendDown, TrendUp } from 'phosphor-react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

import { colors, spacing, radius, shadow, typography } from '../../constants/theme-new';
import { pastelColors } from '../../constants/pastel-theme';
import { useWeightStore } from '../../stores/weightStore';
import { useProfileStore } from '../../stores/profileStore';
import { calculateBMI, getBMICategory } from '../../constants/tdee';
import AnimatedCard from '../../components/ui/AnimatedCard';
import AnimatedButton from '../../components/ui/AnimatedButton';
import { StatsCard, ProgressBar } from '../../components/ui/StatsCard';
import BottomNav from '../../components/BottomNav';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - spacing.md * 4;
const CHART_HEIGHT = 160;
const PAD = { top: 16, bottom: 28, left: 44, right: 16 };

type Range = 7 | 30 | 90;

function WeightChart({ logs }: { logs: Array<{ dateStr: string; weightKg: number }> }) {
  if (logs.length < 2) {
    return (
      <View style={chartStyles.empty}>
        <Text style={chartStyles.emptyText}>Log at least 2 days to see your trend</Text>
      </View>
    );
  }

  const weights = logs.map((l) => l.weightKg);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const innerW = CHART_WIDTH - PAD.left - PAD.right;
  const innerH = CHART_HEIGHT - PAD.top - PAD.bottom;

  const toX = (i: number) => PAD.left + (i / Math.max(logs.length - 1, 1)) * innerW;
  const toY = (w: number) =>
    PAD.top + innerH - ((w - minW) / (maxW - minW)) * innerH;

  const points = logs.map((l, i) => `${toX(i)},${toY(l.weightKg)}`).join(' ');
  const lastIdx = logs.length - 1;

  const mid = (minW + maxW) / 2;
  const yLabels = [maxW, mid, minW];

  const fmtDate = (ds: string) => {
    const d = new Date(ds);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {yLabels.map((v, idx) => {
        const y = toY(v);
        return (
          <View key={idx}>
            <Line
              x1={PAD.left}
              y1={y}
              x2={CHART_WIDTH - PAD.right}
              y2={y}
              stroke={colors.borderLight}
              strokeWidth={1}
            />
            <SvgText
              x={PAD.left - 4}
              y={y + 4}
              fontSize={10}
              fill={colors.textTertiary}
              textAnchor="end"
            >
              {v.toFixed(1)}
            </SvgText>
          </View>
        );
      })}

      <SvgText x={PAD.left} y={CHART_HEIGHT - 6} fontSize={10} fill={colors.textTertiary}>
        {fmtDate(logs[0].dateStr)}
      </SvgText>
      <SvgText
        x={CHART_WIDTH - PAD.right}
        y={CHART_HEIGHT - 6}
        fontSize={10}
        fill={colors.textTertiary}
        textAnchor="end"
      >
        {fmtDate(logs[lastIdx].dateStr)}
      </SvgText>

      <Polyline
        points={points}
        fill="none"
        stroke={colors.primary}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <Circle
        cx={toX(lastIdx)}
        cy={toY(logs[lastIdx].weightKg)}
        r={6}
        fill={colors.primary}
      />
    </Svg>
  );
}

const chartStyles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: spacing.lg },
  emptyText: { ...typography.bodySm, color: colors.textSecondary, textAlign: 'center' },
});

export default function WeightScreen() {
  const { t } = useTranslation();
  const { logs, todayLog, logWeight, deleteLog } = useWeightStore();
  const profile = useProfileStore((s) => s.profile);

  const [inputWeight, setInputWeight] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState<Range>(30);

  useFocusEffect(
    useCallback(() => {
      useWeightStore.getState().loadLogs();
    }, [])
  );

  const handleLog = async () => {
    const kg = parseFloat(inputWeight);
    if (isNaN(kg) || kg < 20 || kg > 300) {
      Alert.alert('Invalid weight', 'Please enter a weight between 20 and 300 kg.');
      return;
    }
    setSaving(true);
    try {
      await logWeight(kg, inputNote.trim() || undefined, profile?.heightCm);
      setInputWeight('');
      setInputNote('');
    } catch {
      Alert.alert('Error', 'Could not save weight. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const displayLogs = logs.slice(-range);

  const startWeight = logs.length > 0 ? logs[0].weightKg : profile?.weightKg ?? 0;
  const currentWeight = todayLog?.weightKg ?? profile?.weightKg ?? 0;
  const targetWeight = profile?.targetWeightKg ?? currentWeight;
  const totalNeeded = Math.abs(startWeight - targetWeight);
  const achieved = Math.abs(startWeight - currentWeight);
  const goalProgress = totalNeeded > 0 ? Math.min(achieved / totalNeeded, 1) : 0;
  const lost = parseFloat((startWeight - currentWeight).toFixed(1));
  const isGaining = lost < 0;

  const bmi = profile
    ? parseFloat(calculateBMI(currentWeight, profile.heightCm).toFixed(1))
    : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  const bmiChipColor =
    bmiCategory === 'normal'
      ? colors.primary
      : bmiCategory === 'overweight'
      ? colors.warning
      : bmiCategory === 'obese'
      ? colors.danger
      : colors.secondary;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
      >
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <Text style={styles.title}>⚖️ Weight</Text>
        <Text style={styles.subtitle}>Track your journey daily</Text>
      </Animated.View>

      {/* Log Input Card */}
      <AnimatedCard variant="elevated" padding="lg" style={styles.logCard}>
        <Text style={styles.cardTitle}>Log Today's Weight</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.weightInput}
            placeholder="kg"
            placeholderTextColor={colors.textPlaceholder}
            keyboardType="decimal-pad"
            value={inputWeight}
            onChangeText={setInputWeight}
          />
          <TextInput
            style={styles.noteInput}
            placeholder="Note (optional)"
            placeholderTextColor={colors.textPlaceholder}
            value={inputNote}
            onChangeText={setInputNote}
          />
        </View>
        <AnimatedButton
          title={todayLog ? 'Update Weight' : 'Log Weight'}
          onPress={handleLog}
          disabled={!inputWeight || saving}
          loading={saving}
          fullWidth
          size="md"
        />
        {todayLog && (
          <Animated.View entering={FadeIn.springify()} style={styles.loggedBadge}>
            <CheckCircle size={16} weight="fill" color={colors.primary} />
            <Text style={styles.loggedText}>
              ✓ Logged: {todayLog.weightKg} kg
            </Text>
          </Animated.View>
        )}
      </AnimatedCard>

      {/* Goal Progress */}
      {profile && (
        <AnimatedCard variant="default" padding="md" style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitle}>
              {isGaining ? (
                <TrendUp size={20} weight="fill" color={colors.warning} />
              ) : (
                <TrendDown size={20} weight="fill" color={colors.primary} />
              )}
              <Text style={styles.goalTitleText}>Goal Progress</Text>
            </View>
            {bmi && (
              <View style={[styles.bmiChip, { backgroundColor: bmiChipColor + '18' }]}>
                <Text style={[styles.bmiChipText, { color: bmiChipColor }]}>
                  BMI {bmi}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.goalRow}>
            <View style={styles.goalStat}>
              <Text style={styles.goalValue}>{currentWeight} kg</Text>
              <Text style={styles.goalLabel}>current</Text>
            </View>
            <ArrowRight size={18} color={colors.textTertiary} />
            <View style={styles.goalStat}>
              <Text style={[styles.goalValue, { color: colors.primary }]}>{targetWeight} kg</Text>
              <Text style={styles.goalLabel}>target</Text>
            </View>
          </View>

          <ProgressBar
            progress={goalProgress}
            color={colors.primary}
            height={10}
            borderRadius={5}
          />

          <View style={styles.goalMeta}>
            <Text style={styles.goalMetaText}>
              {lost > 0 ? `↓ ${lost.toFixed(1)}kg lost` : lost < 0 ? `↑ ${Math.abs(lost).toFixed(1)}kg gained` : 'No change yet'}
              {' · '}
              {Math.abs(currentWeight - targetWeight).toFixed(1)}kg to go
            </Text>
          </View>
        </AnimatedCard>
      )}

      {/* Chart */}
      <AnimatedCard variant="default" padding="md" style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.cardTitle}>Weight Trend</Text>
          <View style={styles.rangeRow}>
            {([7, 30, 90] as Range[]).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRange(r)}
                style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
              >
                <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>
                  {r}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <WeightChart logs={displayLogs} />
      </AnimatedCard>

      {/* Recent History */}
      {logs.length > 0 && (
        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <Text style={styles.sectionTitle}>Recent History</Text>
          <AnimatedCard variant="default" padding="sm">
            {[...logs].reverse().slice(0, 7).map((log, idx) => (
              <View
                key={log.id}
                style={[styles.historyRow, idx < 6 && styles.historyRowBorder]}
              >
                <View>
                  <Text style={styles.historyDate}>{log.dateStr}</Text>
                  {log.note && <Text style={styles.historyNote}>{log.note}</Text>}
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyWeight}>{log.weightKg} kg</Text>
                  {log.bmi && <Text style={styles.historyBmi}>BMI {log.bmi}</Text>}
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert('Delete Log', 'Remove this weight log?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteLog(log.id) },
                      ])
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash size={14} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </AnimatedCard>
        </Animated.View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
    <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  title: {
    ...typography.display,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
  },
  logCard: {
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  weightInput: {
    width: 110,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.subtitle,
    color: colors.text,
  },
  noteInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  loggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  loggedText: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
  },
  goalCard: {
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  goalTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalTitleText: {
    ...typography.subtitle,
    color: colors.text,
  },
  bmiChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  bmiChipText: {
    ...typography.caption,
    fontWeight: '700',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  goalStat: {
    alignItems: 'center',
  },
  goalValue: {
    ...typography.heading,
    fontWeight: '800',
    color: colors.text,
  },
  goalLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  goalMeta: {
    marginTop: spacing.sm,
  },
  goalMetaText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chartCard: {
    marginBottom: spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  rangeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  rangeBtnActive: {
    backgroundColor: colors.primary,
  },
  rangeBtnText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rangeBtnTextActive: {
    color: colors.white,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  historyDate: {
    ...typography.bodySm,
    color: colors.text,
  },
  historyNote: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 1,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyWeight: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.text,
  },
  historyBmi: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
