import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { colors, typography, spacing, radius, shadow } from '../constants/theme-new';
import { useProfileStore } from '../stores/profileStore';
import { useCycleStore, type FlowLevel } from '../stores/cycleStore';
import { predictCycle, CYCLE_PHASE_COPY } from '../services/cycleTracking';

const C = colors;
const FLOWS: FlowLevel[] = ['spotting', 'light', 'medium', 'heavy'];

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export default function CycleTrackingScreen() {
  const profile = useProfileStore((s) => s.profile);
  const updateCycleSettings = useProfileStore((s) => s.updateCycleSettings);
  const { logs, loadLogs, logFlow, deleteLog } = useCycleStore();
  const [selectedFlow, setSelectedFlow] = useState<FlowLevel>('medium');

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [])
  );

  if (!profile) return null;

  const enabled = profile.cycleTrackingEnabled;
  const today = todayStr();
  const todayLog = logs.find((l) => l.dateStr === today);
  const prediction = predictCycle(profile.lastPeriodStart, profile.avgCycleLengthDays, profile.avgPeriodLengthDays, today);

  const handleToggle = async (value: boolean) => {
    await updateCycleSettings({ cycleTrackingEnabled: value });
  };

  const handleLogToday = async () => {
    try {
      await logFlow(today, selectedFlow);
    } catch {
      Alert.alert('Error', 'Could not save your entry. Please try again.');
    }
  };

  const handleClearToday = async () => {
    await deleteLog(today);
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <CaretLeft size={22} color={C.text} weight="bold" />
        </Pressable>
        <Text style={s.headerTitle}>Cycle Tracking</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Track my cycle</Text>
              <Text style={s.cardSub}>Get phase-aware copy on weigh-in reminders. Fully optional, private to this device.</Text>
            </View>
            <Switch value={enabled} onValueChange={handleToggle} trackColor={{ false: C.border, true: C.primary }} thumbColor={C.white} />
          </View>
        </View>

        {enabled && (
          <>
            {prediction && (
              <View style={[s.card, s.phaseCard]}>
                <Text style={s.phaseLabel}>{CYCLE_PHASE_COPY[prediction.phase].label} · Day {prediction.dayInCycle}</Text>
                <Text style={s.phaseNote}>{CYCLE_PHASE_COPY[prediction.phase].note}</Text>
                <Text style={s.phaseNext}>
                  Next period in ~{prediction.daysUntilNextPeriod} day{prediction.daysUntilNextPeriod === 1 ? '' : 's'}
                </Text>
              </View>
            )}

            <Text style={s.sectionTitle}>Log today</Text>
            <View style={s.card}>
              {todayLog ? (
                <View>
                  <Text style={s.cardSub}>Logged: {todayLog.flow} flow</Text>
                  <Pressable style={s.clearBtn} onPress={handleClearToday}>
                    <Text style={s.clearBtnText}>Remove today's entry</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={s.flowRow}>
                    {FLOWS.map((f) => (
                      <Pressable
                        key={f}
                        style={[s.flowChip, selectedFlow === f && s.flowChipActive]}
                        onPress={() => setSelectedFlow(f)}
                      >
                        <Text style={[s.flowChipText, selectedFlow === f && s.flowChipTextActive]}>{f}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable style={s.saveBtn} onPress={handleLogToday}>
                    <Text style={s.saveBtnText}>Save today's entry</Text>
                  </Pressable>
                </>
              )}
            </View>

            <Text style={s.sectionTitle}>Cycle settings</Text>
            <View style={s.card}>
              <View style={s.settingRow}>
                <Text style={s.cardSub}>Average cycle length</Text>
                <Stepper
                  value={profile.avgCycleLengthDays}
                  onChange={(v) => updateCycleSettings({ avgCycleLengthDays: v })}
                  min={21}
                  max={45}
                  suffix=" days"
                />
              </View>
              <View style={s.settingRow}>
                <Text style={s.cardSub}>Average period length</Text>
                <Stepper
                  value={profile.avgPeriodLengthDays}
                  onChange={(v) => updateCycleSettings({ avgPeriodLengthDays: v })}
                  min={2}
                  max={10}
                  suffix=" days"
                />
              </View>
            </View>

            {logs.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Recent entries</Text>
                <View style={s.card}>
                  {logs.slice(0, 10).map((log) => (
                    <View key={log.id} style={s.historyRow}>
                      <Text style={s.historyDate}>{log.dateStr}</Text>
                      <Text style={s.historyFlow}>{log.flow}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stepper({ value, onChange, min, max, suffix }: { value: number; onChange: (v: number) => void; min: number; max: number; suffix: string }) {
  return (
    <View style={s.stepper}>
      <Pressable style={s.stepperBtn} onPress={() => onChange(Math.max(min, value - 1))}>
        <Text style={s.stepperBtnText}>−</Text>
      </Pressable>
      <Text style={s.stepperValue}>{value}{suffix}</Text>
      <Pressable style={s.stepperBtn} onPress={() => onChange(Math.min(max, value + 1))}>
        <Text style={s.stepperBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { ...typography.title, color: C.text },
  content: { padding: spacing.md, paddingBottom: spacing['2xl'], gap: spacing.md },
  card: { backgroundColor: C.surface, borderRadius: radius.xl, padding: spacing.md, ...shadow.sm, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { ...typography.subtitle, color: C.text },
  cardSub: { ...typography.caption, color: C.textSecondary, marginTop: 2 },
  sectionTitle: { ...typography.label, color: C.textSecondary, marginTop: spacing.xs },
  phaseCard: { backgroundColor: C.accentLight },
  phaseLabel: { ...typography.subtitle, color: C.text },
  phaseNote: { ...typography.caption, color: C.textSecondary, marginTop: 4 },
  phaseNext: { ...typography.caption, color: C.text, marginTop: 8, fontWeight: '700' },
  flowRow: { flexDirection: 'row', gap: spacing.xs },
  flowChip: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  flowChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  flowChipText: { ...typography.caption, color: C.textSecondary, fontWeight: '600' },
  flowChipTextActive: { color: C.white },
  saveBtn: { backgroundColor: C.primary, borderRadius: radius.lg, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xs },
  saveBtnText: { color: C.white, fontWeight: '800' },
  clearBtn: { marginTop: spacing.sm },
  clearBtnText: { color: C.danger, fontWeight: '700', fontSize: 13 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepperBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontSize: 18, fontWeight: '800', color: C.text },
  stepperValue: { ...typography.label, color: C.text, minWidth: 70, textAlign: 'center' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  historyDate: { ...typography.caption, color: C.text },
  historyFlow: { ...typography.caption, color: C.textSecondary, textTransform: 'capitalize' },
});
