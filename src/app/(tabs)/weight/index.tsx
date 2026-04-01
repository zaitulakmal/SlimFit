/**
 * Weight tab — log daily weight + view progress chart.
 * WGHT-01: log weight with optional note
 * WGHT-02: line chart (7 / 30 / 90 day views)
 * WGHT-03: goal progress indicator
 * WGHT-04: BMI tracked alongside weight
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
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

import { colors, spacing, typography } from '../../../constants/theme';
import { useWeightStore } from '../../../stores/weightStore';
import { useProfileStore } from '../../../stores/profileStore';
import { calculateBMI, getBMICategory } from '../../../constants/tdee';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - spacing.md * 4;
const CHART_HEIGHT = 160;
const PAD = { top: 16, bottom: 28, left: 40, right: 16 };

type Range = 7 | 30 | 90;

// ---------------------------------------------------------------------------
// Mini line chart using react-native-svg
// ---------------------------------------------------------------------------

function WeightChart({ logs }: { logs: Array<{ dateStr: string; weightKg: number }> }) {
  if (logs.length < 2) {
    return (
      <View style={chart.empty}>
        <Text style={chart.emptyText}>Log at least 2 days to see your trend</Text>
      </View>
    );
  }

  const weights = logs.map((l) => l.weightKg);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const innerW = CHART_WIDTH - PAD.left - PAD.right;
  const innerH = CHART_HEIGHT - PAD.top - PAD.bottom;

  const toX = (i: number) => PAD.left + (i / (logs.length - 1)) * innerW;
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
          <React.Fragment key={idx}>
            <Line
              x1={PAD.left}
              y1={y}
              x2={CHART_WIDTH - PAD.right}
              y2={y}
              stroke={colors.border}
              strokeWidth={1}
            />
            <SvgText
              x={PAD.left - 4}
              y={y + 4}
              fontSize={10}
              fill={colors.textSecondary}
              textAnchor="end"
            >
              {v.toFixed(1)}
            </SvgText>
          </React.Fragment>
        );
      })}

      <SvgText x={PAD.left} y={CHART_HEIGHT - 6} fontSize={10} fill={colors.textSecondary}>
        {fmtDate(logs[0].dateStr)}
      </SvgText>
      <SvgText
        x={CHART_WIDTH - PAD.right}
        y={CHART_HEIGHT - 6}
        fontSize={10}
        fill={colors.textSecondary}
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
        r={5}
        fill={colors.primary}
      />
    </Svg>
  );
}

import React from 'react';

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

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

  const bmi = profile
    ? parseFloat(calculateBMI(currentWeight, profile.heightCm).toFixed(1))
    : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>{t('weight.title')}</Text>

      {/* Log input */}
      <View style={s.card}>
        <Text style={s.cardTitle}>{t('weight.log_today')}</Text>
        <View style={s.row}>
          <TextInput
            style={[s.input, s.weightInput]}
            placeholder="kg"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={inputWeight}
            onChangeText={setInputWeight}
          />
          <TextInput
            style={[s.input, s.noteInput]}
            placeholder={t('weight.note_placeholder')}
            placeholderTextColor={colors.textSecondary}
            value={inputNote}
            onChangeText={setInputNote}
          />
        </View>
        <TouchableOpacity
          style={[s.btn, (!inputWeight || saving) && s.btnDisabled]}
          onPress={handleLog}
          disabled={saving || !inputWeight}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>
            {todayLog ? t('weight.update') : t('weight.log_btn')}
          </Text>
        </TouchableOpacity>
        {todayLog && (
          <View style={s.todayRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={s.todayText}>
              {t('weight.today_logged', { n: todayLog.weightKg })}
            </Text>
          </View>
        )}
      </View>

      {/* Goal progress */}
      {profile && (
        <View style={s.card}>
          <Text style={s.cardTitle}>{t('weight.goal_progress')}</Text>
          <View style={s.goalRow}>
            <View style={s.goalStat}>
              <Text style={s.goalValue}>{currentWeight} kg</Text>
              <Text style={s.goalLabel}>{t('weight.current')}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
            <View style={s.goalStat}>
              <Text style={[s.goalValue, { color: colors.primary }]}>{targetWeight} kg</Text>
              <Text style={s.goalLabel}>{t('weight.target')}</Text>
            </View>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${goalProgress * 100}%` as any }]} />
          </View>
          <Text style={s.goalSub}>
            {lost > 0
              ? t('weight.lost', { n: lost })
              : lost < 0
              ? t('weight.gained', { n: Math.abs(lost) })
              : t('weight.no_change')}
            {'  ·  '}
            {t('weight.to_go', { n: Math.abs(parseFloat((currentWeight - targetWeight).toFixed(1))) })}
          </Text>
          {bmi && bmiCategory && (
            <View style={s.bmiRow}>
              <Text style={s.bmiValue}>BMI {bmi}</Text>
              <Text style={s.bmiCat}> · {t(`profile.bmi_${bmiCategory}`)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Chart */}
      <View style={s.card}>
        <View style={s.chartHeader}>
          <Text style={s.cardTitle}>{t('weight.trend')}</Text>
          <View style={s.rangeRow}>
            {([7, 30, 90] as Range[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[s.rangeBtn, range === r && s.rangeBtnActive]}
                onPress={() => setRange(r)}
              >
                <Text style={[s.rangeBtnText, range === r && s.rangeBtnTextActive]}>
                  {r}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <WeightChart logs={displayLogs} />
      </View>

      {/* History list */}
      {logs.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>{t('weight.history')}</Text>
          {[...logs].reverse().slice(0, 10).map((log) => (
            <View key={log.id} style={s.logRow}>
              <View style={s.logLeft}>
                <Text style={s.logDate}>{log.dateStr}</Text>
                {log.note ? <Text style={s.logNote}>{log.note}</Text> : null}
              </View>
              <View style={s.logRight}>
                <Text style={s.logWeight}>{log.weightKg} kg</Text>
                {log.bmi ? <Text style={s.logBmi}>BMI {log.bmi}</Text> : null}
              </View>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(t('weight.delete_title'), t('weight.delete_confirm'), [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('common.delete'), style: 'destructive', onPress: () => deleteLog(log.id) },
                  ])
                }
                style={s.deleteBtn}
              >
                <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.md },
  card: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, marginBottom: spacing.md },
  cardTitle: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    ...typography.body,
    color: colors.textPrimary,
  },
  weightInput: { width: 110 },
  noteInput: { flex: 1 },
  btn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { ...typography.body, color: colors.textOnAccent },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  todayText: { ...typography.label, color: colors.primary },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  goalStat: { alignItems: 'center' },
  goalValue: { ...typography.heading, color: colors.textPrimary },
  goalLabel: { ...typography.label, color: colors.textSecondary },
  progressTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.xs },
  progressFill: { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
  goalSub: { ...typography.label, color: colors.textSecondary, marginTop: spacing.xs },
  bmiRow: { flexDirection: 'row', marginTop: spacing.sm },
  bmiValue: { ...typography.label, color: colors.textPrimary },
  bmiCat: { ...typography.label, color: colors.primary },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  rangeRow: { flexDirection: 'row', gap: spacing.xs },
  rangeBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 6, backgroundColor: colors.border },
  rangeBtnActive: { backgroundColor: colors.primary },
  rangeBtnText: { ...typography.label, color: colors.textSecondary },
  rangeBtnTextActive: { color: colors.textOnAccent },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  logLeft: { flex: 1 },
  logRight: { alignItems: 'flex-end', marginRight: spacing.sm },
  logDate: { ...typography.label, color: colors.textSecondary },
  logNote: { ...typography.label, color: colors.textSecondary, fontStyle: 'italic' },
  logWeight: { ...typography.body, color: colors.textPrimary },
  logBmi: { ...typography.label, color: colors.textSecondary },
  deleteBtn: { padding: spacing.xs },
});

const chart = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: spacing.lg },
  emptyText: { ...typography.label, color: colors.textSecondary, textAlign: 'center' },
});
