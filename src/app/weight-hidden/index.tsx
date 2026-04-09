/**
 * Weight Screen — Modern Figma-Inspired Design
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
  Modal,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CheckCircle, ArrowRight, Trash, TrendDown, TrendUp, Camera, Barcode, X, Plus, Keyboard } from 'phosphor-react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText, Rect, Defs, LinearGradient, Stop, Ellipse, Path, G } from 'react-native-svg';
import { colors, spacing, radius, shadow, typography } from '../../constants/theme-new';
import { useWeightStore } from '../../stores/weightStore';
import { useProfileStore } from '../../stores/profileStore';
import { calculateBMI, getBMICategory } from '../../constants/tdee';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const CHART_HEIGHT = 140;
const PAD = { top: 16, bottom: 24, left: 40, right: 16 };

type Range = 7 | 30 | 90;

const COLORS = {
  primary: '#A6171C',
  secondary: '#D6D0C5',
  accent: '#F1C045',
  background: '#FDF8F0',
  white: '#FFFFFF',
  text: '#4A4A4A',
  textSub: '#7A7A7A',
  border: '#E8E4DE',
};

function ProgressRing({ progress, size = 100, strokeWidth = 10 }: { progress: number; size?: number; strokeWidth?: number }) {
  const animatedProgress = useSharedValue(0);
  
  useFocusEffect(
    useCallback(() => {
      animatedProgress.value = withTiming(Math.min(progress, 1), { duration: 1200 });
    }, [progress])
  );
  
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  
  const animatedProps = useAnimatedProps(() => {
    const offset = circ * (1 - animatedProgress.value);
    return { strokeDashoffset: offset };
  });
  
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.primary} />
            <Stop offset="100%" stopColor={COLORS.accent} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size/2}
          cy={size/2}
          r={r}
          stroke={COLORS.secondary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size/2}
          cy={size/2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          animatedProps={animatedProps}
          transform={`rotate(-90, ${size/2}, ${size/2})`}
        />
      </Svg>
    </View>
  );
}

function WeightChart({ logs }: { logs: Array<{ dateStr: string; weightKg: number }> }) {
  if (logs.length < 2) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <Text style={{ color: COLORS.textSub, textAlign: 'center' }}>Log at least 2 days to see your trend</Text>
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
          <G key={idx}>
            <Line
              x1={PAD.left}
              y1={y}
              x2={CHART_WIDTH - PAD.right}
              y2={y}
              stroke={COLORS.secondary}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <SvgText
              x={PAD.left - 4}
              y={y + 4}
              fontSize={10}
              fill={COLORS.textSub}
              textAnchor="end"
            >
              {v.toFixed(1)}
            </SvgText>
          </G>
        );
      })}

      <SvgText x={PAD.left} y={CHART_HEIGHT - 4} fontSize={10} fill={COLORS.textSub}>
        {fmtDate(logs[0].dateStr)}
      </SvgText>
      <SvgText
        x={CHART_WIDTH - PAD.right}
        y={CHART_HEIGHT - 4}
        fontSize={10}
        fill={COLORS.textSub}
        textAnchor="end"
      >
        {fmtDate(logs[lastIdx].dateStr)}
      </SvgText>

      <Polyline
        points={points}
        fill="none"
        stroke={COLORS.primary}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <Circle
        cx={toX(lastIdx)}
        cy={toY(logs[lastIdx].weightKg)}
        r={5}
        fill={COLORS.primary}
      />
    </Svg>
  );
}

export default function WeightScreen() {
  const { t } = useTranslation();
  const { logs, todayLog, logWeight, deleteLog } = useWeightStore();
  const profile = useProfileStore((s) => s.profile);

  const [inputWeight, setInputWeight] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState<Range>(30);
  const [showInput, setShowInput] = useState(false);

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
      setShowInput(false);
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

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <Text style={styles.headerTitle}>Progress</Text>
          <Text style={styles.headerSubtitle}>Track your weight journey</Text>
        </Animated.View>

        {/* Progress Ring Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.card}>
          <View style={styles.progressContainer}>
            <View style={styles.ringWrapper}>
              <ProgressRing progress={goalProgress} size={130} strokeWidth={12} />
              <View style={styles.ringCenter}>
                <Text style={styles.ringPercent}>{Math.round(goalProgress * 100)}%</Text>
                <Text style={styles.ringLabel}>of goal</Text>
              </View>
            </View>
            
            <View style={styles.progressInfo}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{currentWeight}</Text>
                <Text style={styles.statLabel}>Current</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.primary }]}>{targetWeight}</Text>
                <Text style={styles.statLabel}>Goal</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: isGaining ? '#FF9800' : COLORS.primary }]}>
                  {isGaining ? '+' : '-'}{Math.abs(lost)}
                </Text>
                <Text style={styles.statLabel}>{isGaining ? 'Gain' : 'Lost'}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Add Buttons - Scanner & Camera */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickBtn}
            onPress={() => router.push('/(tabs)/food-log/scan')}
          >
            <View style={[styles.quickBtnIcon, { backgroundColor: '#E8F5E9' }]}>
              <Barcode size={24} color="#4CAF50" weight="bold" />
            </View>
            <Text style={styles.quickBtnLabel}>Scan</Text>
            <Text style={styles.quickBtnSub}>Barcode</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickBtn}
            onPress={() => router.push('/(tabs)/food-log/capture')}
          >
            <View style={[styles.quickBtnIcon, { backgroundColor: '#FFF3E0' }]}>
              <Camera size={24} color="#FF9800" weight="bold" />
            </View>
            <Text style={styles.quickBtnLabel}>Camera</Text>
            <Text style={styles.quickBtnSub}>AI Capture</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickBtn}
            onPress={() => setShowInput(!showInput)}
          >
            <View style={[styles.quickBtnIcon, { backgroundColor: '#FCE4EC' }]}>
              <Keyboard size={24} color="#A6171C" weight="bold" />
            </View>
            <Text style={styles.quickBtnLabel}>Manual</Text>
            <Text style={styles.quickBtnSub}>Type</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Weight Input Modal/Inline */}
        {showInput && (
          <Animated.View entering={FadeInDown.springify()} style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputTitle}>Add Weight</Text>
              <TouchableOpacity onPress={() => setShowInput(false)}>
                <X size={20} color={COLORS.textSub} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputRow}>
              <TextInput
                style={styles.weightInput}
                placeholder="0.0"
                placeholderTextColor="#A0A0A0"
                keyboardType="decimal-pad"
                value={inputWeight}
                onChangeText={setInputWeight}
              />
              <Text style={styles.kgLabel}>kg</Text>
            </View>

            <View style={styles.inputActions}>
              <TouchableOpacity
                style={[styles.inputBtn, styles.inputBtnPrimary]}
                onPress={handleLog}
                disabled={!inputWeight || saving}
              >
                <Text style={styles.inputBtnText}>
                  {todayLog ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            {todayLog && (
              <Text style={styles.currentLogged}>
                Current: {todayLog.weightKg} kg
              </Text>
            )}
          </Animated.View>
        )}

        {/* Weight Trend Chart */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weight Trend</Text>
            <View style={styles.rangeButtons}>
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
        </Animated.View>

        {/* Recent History */}
        {logs.length > 0 && (
          <Animated.View entering={FadeInUp.delay(250).springify()}>
            <Text style={styles.sectionTitle}>Recent History</Text>
            <View style={styles.historyCard}>
              {[...logs].reverse().slice(0, 7).map((log, idx) => (
                <View
                  key={log.id}
                  style={[styles.historyRow, idx < 6 && styles.historyBorder]}
                >
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{log.dateStr}</Text>
                    {log.note && <Text style={styles.historyNote}>{log.note}</Text>}
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyWeight}>{log.weightKg} kg</Text>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert('Delete Log', 'Remove this weight log?', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteLog(log.id) },
                        ])
                      }
                    >
                      <Trash size={16} color={COLORS.textSub} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSub,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  ringWrapper: {
    position: 'relative',
  },
  ringCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -35 }, { translateY: -15 }],
    alignItems: 'center',
  },
  ringPercent: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  ringLabel: {
    fontSize: 11,
    color: COLORS.textSub,
  },
  progressInfo: {
    flex: 1,
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  statDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSub,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  quickBtnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  quickBtnSub: {
    fontSize: 10,
    color: COLORS.textSub,
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.md,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  inputTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  weightInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  kgLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSub,
    marginLeft: spacing.sm,
  },
  inputActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  inputBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  inputBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  currentLogged: {
    textAlign: 'center',
    marginTop: spacing.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  rangeButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  rangeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  rangeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  rangeBtnText: {
    fontSize: 12,
    color: COLORS.textSub,
    fontWeight: '600',
  },
  rangeBtnTextActive: {
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: spacing.md,
  },
  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: spacing.md,
    ...shadow.md,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  historyBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    color: COLORS.text,
  },
  historyNote: {
    fontSize: 12,
    color: COLORS.textSub,
    fontStyle: 'italic',
    marginTop: 1,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  historyWeight: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
