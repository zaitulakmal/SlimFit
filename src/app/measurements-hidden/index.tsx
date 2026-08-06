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
import { useFocusEffect, router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { CaretLeft, Ruler, Trash, CheckCircle } from 'phosphor-react-native';
import Svg, { Polyline, Circle, Rect, Defs, LinearGradient, Stop, Path } from 'react-native-svg';

import { useMeasurementsStore, type BodyMeasurement } from '../../stores/measurementsStore';
import AdBanner from '../../components/ui/AdBanner';
import { maybeShowInterstitial } from '../../services/ads';

const { width: W } = Dimensions.get('window');

const C = {
  navy: '#3D2C3E',
  navyLight: '#243470',
  primary: '#FF6B8A',
  amber: '#FFC53D',
  bg: '#FFF8F3',
  surface: '#FFFFFF',
  border: '#EDE8DF',
  text: '#3D2C3E',
  textSub: '#7A6A5A',
  textLight: '#A89880',
  green: '#34C6A0',
};

type MeasurementKey = 'waistCm' | 'hipsCm' | 'chestCm' | 'armsCm' | 'neckCm';

const FIELDS: { key: MeasurementKey; label: string; color: string }[] = [
  { key: 'waistCm',  label: 'Waist',  color: '#FF6B8A' },
  { key: 'hipsCm',   label: 'Hips',   color: '#FFA45B' },
  { key: 'chestCm',  label: 'Chest',  color: '#FFC53D' },
  { key: 'armsCm',   label: 'Arms',   color: '#34C6A0' },
  { key: 'neckCm',   label: 'Neck',   color: '#42A5F5' },
];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = todayStr();
  if (dateStr === today) return 'Today';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// Mini sparkline for a measurement across last entries
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const h = 28;
  const w = 70;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (w - 4) + 2;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Svg width={w} height={h}>
      <Polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => {
        const x = (i / (values.length - 1)) * (w - 4) + 2;
        const y = h - ((v - min) / range) * (h - 6) - 3;
        return <Circle key={i} cx={x} cy={y} r={i === values.length - 1 ? 3 : 2} fill={color} />;
      })}
    </Svg>
  );
}

export default function MeasurementsScreen() {
  const { logs, isLoaded, loadLogs, logMeasurement, deleteMeasurement } = useMeasurementsStore();

  const [inputs, setInputs] = useState<Record<string, string>>({
    waistCm: '', hipsCm: '', chestCm: '', armsCm: '', neckCm: '',
  });
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
      maybeShowInterstitial();
    }, [])
  );

  // Pre-fill inputs with today's entry if it exists
  useFocusEffect(
    useCallback(() => {
      const today = logs.find((l) => l.dateStr === todayStr());
      if (today) {
        setInputs({
          waistCm:  today.waistCm  != null ? String(today.waistCm)  : '',
          hipsCm:   today.hipsCm   != null ? String(today.hipsCm)   : '',
          chestCm:  today.chestCm  != null ? String(today.chestCm)  : '',
          armsCm:   today.armsCm   != null ? String(today.armsCm)   : '',
          neckCm:   today.neckCm   != null ? String(today.neckCm)   : '',
        });
      }
    }, [logs])
  );

  const handleSave = async () => {
    const hasAny = FIELDS.some((f) => inputs[f.key].trim() !== '');
    if (!hasAny) {
      Alert.alert('No values', 'Enter at least one measurement to save.');
      return;
    }
    setSaving(true);
    await logMeasurement({
      dateStr:  todayStr(),
      waistCm:  inputs.waistCm.trim()  ? parseFloat(inputs.waistCm)  : null,
      hipsCm:   inputs.hipsCm.trim()   ? parseFloat(inputs.hipsCm)   : null,
      chestCm:  inputs.chestCm.trim()  ? parseFloat(inputs.chestCm)  : null,
      armsCm:   inputs.armsCm.trim()   ? parseFloat(inputs.armsCm)   : null,
      neckCm:   inputs.neckCm.trim()   ? parseFloat(inputs.neckCm)   : null,
    });
    setSaving(false);
  };

  const handleDelete = (id: number, dateStr: string) => {
    Alert.alert(
      'Delete Entry',
      `Remove measurements for ${formatDate(dateStr)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMeasurement(id) },
      ]
    );
  };

  // Build sparkline values per field from last 10 entries (oldest → newest)
  const historyDesc = [...logs].slice(0, 10);
  const historyAsc  = [...historyDesc].reverse();

  function sparkValues(key: MeasurementKey) {
    return historyAsc
      .map((l) => l[key])
      .filter((v): v is number => v != null);
  }

  const todayEntry = logs.find((l) => l.dateStr === todayStr());

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Animated.View entering={FadeInDown.delay(0).springify()} style={s.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <CaretLeft size={22} weight="bold" color="#FFFFFF" />
          </TouchableOpacity>
          <View style={s.headerText}>
            <Text style={s.headerTitle}>Body Measurements</Text>
            <Text style={s.headerSub}>Track waist, hips, chest & more in cm</Text>
          </View>
          <View style={s.rulerIcon}>
            <Ruler size={26} weight="fill" color="#FFC53D" />
          </View>
        </Animated.View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Input card */}
        <Animated.View entering={FadeInUp.delay(80).springify()} style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Log Today</Text>
            {todayEntry && (
              <View style={s.savedBadge}>
                <CheckCircle size={14} weight="fill" color={C.green} />
                <Text style={s.savedText}>Saved</Text>
              </View>
            )}
          </View>
          <View style={s.inputGrid}>
            {FIELDS.map((field) => (
              <View key={field.key} style={s.inputItem}>
                <View style={[s.inputDot, { backgroundColor: field.color }]} />
                <Text style={s.inputLabel}>{field.label}</Text>
                <TextInput
                  style={s.inputField}
                  value={inputs[field.key]}
                  onChangeText={(v) => setInputs((prev) => ({ ...prev, [field.key]: v }))}
                  placeholder="—"
                  placeholderTextColor={C.textLight}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                />
                <Text style={s.inputUnit}>cm</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save Measurements'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <AdBanner />

        {/* History */}
        {logs.length > 0 && (
          <Animated.View entering={FadeInUp.delay(160).springify()}>
            <Text style={s.sectionTitle}>Trend (last {Math.min(logs.length, 10)} entries)</Text>

            {/* Sparkline summary card */}
            <View style={s.card}>
              {FIELDS.map((field) => {
                const vals = sparkValues(field.key);
                if (vals.length === 0) return null;
                const latest = vals[vals.length - 1];
                const prev   = vals.length > 1 ? vals[vals.length - 2] : null;
                const diff   = prev != null ? latest - prev : null;
                return (
                  <View key={field.label} style={s.sparkRow}>
                    <View style={[s.sparkDot, { backgroundColor: field.color }]} />
                    <Text style={s.sparkLabel}>{field.label}</Text>
                    <Sparkline values={vals} color={field.color} />
                    <View style={s.sparkRight}>
                      <Text style={[s.sparkVal, { color: field.color }]}>{latest} cm</Text>
                      {diff != null && (
                        <Text style={[s.sparkDiff, { color: diff < 0 ? C.green : diff > 0 ? C.primary : C.textLight }]}>
                          {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} cm
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={s.sectionTitle}>History</Text>
            {historyDesc.map((entry, idx) => (
              <Animated.View key={entry.id} entering={FadeInUp.delay(200 + idx * 40).springify()} style={s.historyCard}>
                <View style={s.historyHeader}>
                  <Text style={s.historyDate}>{formatDate(entry.dateStr)}</Text>
                  <TouchableOpacity
                    onPress={() => handleDelete(entry.id, entry.dateStr)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash size={16} weight="regular" color={C.primary} />
                  </TouchableOpacity>
                </View>
                <View style={s.historyRow}>
                  {FIELDS.map((field) => {
                    const val = entry[field.key];
                    if (val == null) return null;
                    return (
                      <View key={field.label} style={s.historyItem}>
                        <Text style={[s.historyVal, { color: field.color }]}>{val}</Text>
                        <Text style={s.historyField}>{field.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {!isLoaded || logs.length === 0 ? (
          <View style={s.emptyState}>
            <Ruler size={48} weight="regular" color={C.textLight} />
            <Text style={s.emptyTitle}>No measurements yet</Text>
            <Text style={s.emptySub}>Log your first entry above to start tracking progress.</Text>
          </View>
        ) : null}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.navy,
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
    minHeight: 180,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  backBtn: { padding: 6, marginLeft: -4 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, fontWeight: '500', color: C.textSub, marginTop: 2 },
  rulerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(240,200,8,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 18, paddingTop: 20 },

  card: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  savedText: { fontSize: 12, fontWeight: '700', color: C.green },

  inputGrid: { gap: 10, marginBottom: 16 },
  inputItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F6F1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  inputDot: { width: 10, height: 10, borderRadius: 5 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: C.text, flex: 1 },
  inputField: {
    fontSize: 16,
    fontWeight: '700',
    color: C.navy,
    textAlign: 'right',
    minWidth: 60,
    padding: 0,
  },
  inputUnit: { fontSize: 12, fontWeight: '600', color: C.textLight, marginLeft: 4 },

  saveBtn: {
    backgroundColor: C.navy,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginBottom: 10,
    marginTop: 6,
    letterSpacing: -0.1,
  },

  sparkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sparkDot: { width: 10, height: 10, borderRadius: 5 },
  sparkLabel: { fontSize: 13, fontWeight: '600', color: C.text, width: 48 },
  sparkRight: { flex: 1, alignItems: 'flex-end' },
  sparkVal: { fontSize: 15, fontWeight: '800' },
  sparkDiff: { fontSize: 11, fontWeight: '600', marginTop: 1 },

  historyCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyDate: { fontSize: 13, fontWeight: '700', color: C.text },
  historyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  historyItem: { alignItems: 'center', minWidth: 56 },
  historyVal: { fontSize: 15, fontWeight: '800' },
  historyField: { fontSize: 10, fontWeight: '600', color: C.textLight, marginTop: 1 },

  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptySub: { fontSize: 13, fontWeight: '500', color: C.textSub, textAlign: 'center', paddingHorizontal: 20 },
});
