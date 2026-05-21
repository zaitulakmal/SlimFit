import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import Svg, { Circle as SvgCircle, Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import {
  CaretLeft,
  CaretRight,
  Sun,
  CloudSun,
  Moon,
  Coffee,
  PlusCircle,
  Trash,
} from 'phosphor-react-native';

import { pastelColors, pastelSpacing, pastelRadius, mealColors } from '../../../constants/pastel-theme';
import { useFoodStore } from '../../../stores/foodStore';
import { useProfileStore } from '../../../stores/profileStore';
import { calculateCalorieTarget } from '../../../constants/tdee';
import type { GoalType } from '../../../constants/tdee';

const { width: W } = Dimensions.get('window');
const C = pastelColors;

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

function MealIcon({ meal, size, color }: { meal: string; size: number; color: string }) {
  switch (meal) {
    case 'breakfast': return <Sun size={size} weight="fill" color={color} />;
    case 'lunch':     return <CloudSun size={size} weight="fill" color={color} />;
    case 'dinner':    return <Moon size={size} weight="fill" color={color} />;
    case 'snack':     return <Coffee size={size} weight="fill" color={color} />;
    default:          return <Sun size={size} weight="fill" color={color} />;
  }
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = todayStr();
  const yesterday = offsetDate(today, -1);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function offsetDate(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function HeaderDecoration() {
  return (
    <Svg width={W} height={220} style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} 220`}>
      <Defs>
        <LinearGradient id="navyHeaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#1A2B5C" />
          <Stop offset="100%" stopColor="#243470" />
        </LinearGradient>
      </Defs>
      <Rect width={W} height={220} fill="url(#navyHeaderGrad)" />

      <SvgCircle cx={W * 0.85} cy={-10} r={100} fill="#FFFFFF" opacity={0.04} />
      <SvgCircle cx={W * 0.10} cy={230} r={80}  fill="#F0C808" opacity={0.06} />
      <SvgCircle cx={W - 24}   cy={100} r={5}   fill="#F0C808" opacity={0.45} />
      <SvgCircle cx={W - 14}   cy={118} r={3}   fill="#FFFFFF" opacity={0.20} />
      <SvgCircle cx={28}       cy={140} r={6}   fill="#FFFFFF" opacity={0.12} />

      {/* Wavy bottom into cream bg */}
      <Path d={`M0,195 Q${W * 0.25},215 ${W * 0.5},202 Q${W * 0.75},188 ${W},208 L${W},220 L0,220 Z`} fill={C.background} />
    </Svg>
  );
}

function CalorieRing({ consumed, tdee }: { consumed: number; tdee: number }) {
  const size = 84;
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = tdee > 0 ? Math.min(consumed / tdee, 1) : 0;
  const offset = circ * (1 - pct);
  const center = size / 2;
  const isOver = consumed > tdee && tdee > 0;
  const ringColor = isOver ? '#FF6B6B' : '#F0C808';

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <SvgCircle cx={center} cy={center} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={strokeWidth} fill="none" />
        <SvgCircle
          cx={center} cy={center} r={r}
          stroke={ringColor} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>
          {Math.round(consumed)}
        </Text>
        <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: '600' }}>kcal</Text>
      </View>
    </View>
  );
}

function InlineMacro({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(value / target, 1) * 100 : 0;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.65)' }}>{label}</Text>
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>{Math.round(value)}g</Text>
      </View>
      <View style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
        <View style={{ height: 5, borderRadius: 3, backgroundColor: color, width: `${pct}%` }} />
      </View>
    </View>
  );
}

export default function FoodLogScreen() {
  const { t } = useTranslation();
  const { dayLogs, currentDateStr, loadDayLogs, deleteFood, getTotals, getMealLogs } = useFoodStore();
  const profile = useProfileStore((s) => s.profile);

  useFocusEffect(
    useCallback(() => { loadDayLogs(currentDateStr); }, [currentDateStr])
  );

  const totals = getTotals();
  const rawTdee = Number(profile?.tdee) || 0;
  const tdee = rawTdee > 0
    ? calculateCalorieTarget(
        rawTdee,
        (profile?.goalType as GoalType) ?? 'lose_weight',
        profile?.weightKg ?? 0,
        profile?.targetWeightKg ?? profile?.weightKg ?? 0,
        profile?.deadline
      )
    : 0;
  const remaining = Math.round(Math.max(tdee - totals.calories, 0));
  const isOver = totals.calories > tdee && tdee > 0;

  const proteinTarget = Math.round((tdee * 0.25) / 4);
  const carbsTarget   = Math.round((tdee * 0.50) / 4);
  const fatTarget     = Math.round((tdee * 0.25) / 9);

  const navigateDate = (dir: -1 | 1) => {
    const next = offsetDate(currentDateStr, dir);
    loadDayLogs(next);
  };

  const handleDelete = (id: number, foodName: string) => {
    Alert.alert(t('food.delete_title'), t('food.delete_confirm', { name: foodName }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteFood(id) },
    ]);
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <HeaderDecoration />

        <Animated.View entering={FadeInDown.delay(0).springify()} style={s.dateNav}>
          <TouchableOpacity onPress={() => navigateDate(-1)} style={s.navBtn}>
            <CaretLeft size={22} weight="bold" color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => loadDayLogs(todayStr())} style={s.datePill}>
            <Text style={s.dateText}>{formatDate(currentDateStr)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigateDate(1)}
            style={s.navBtn}
            disabled={currentDateStr >= todayStr()}
          >
            <CaretRight
              size={22}
              weight="bold"
              color={currentDateStr >= todayStr() ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.9)'}
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).springify()} style={s.summaryRow}>
          <CalorieRing consumed={totals.calories} tdee={tdee} />
          <View style={s.summaryRight}>
            {tdee > 0 && (
              <View style={s.budgetRow}>
                <Text style={[s.budgetValue, { color: isOver ? '#FF6B6B' : '#FFFFFF' }]}>
                  {isOver ? `+${Math.round(totals.calories - tdee)}` : remaining}
                </Text>
                <Text style={s.budgetLabel}> kcal {isOver ? 'over' : 'left'}</Text>
              </View>
            )}
            <View style={s.macrosCol}>
              <InlineMacro label="Protein" value={totals.proteinG} target={proteinTarget} color={C.coral} />
              <InlineMacro label="Carbs"   value={totals.carbsG}   target={carbsTarget}   color={C.blue}   />
              <InlineMacro label="Fat"     value={totals.fatG}     target={fatTarget}     color={C.amber}  />
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Meal sections */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {MEAL_TYPES.map((meal, idx) => {
          const mealLogs   = getMealLogs(meal);
          const mealCals   = mealLogs.reduce((a, l) => a + Number(l.calories), 0);
          const meta       = mealColors[meal];
          const isLast     = idx === MEAL_TYPES.length - 1;

          return (
            <Animated.View
              key={meal}
              entering={FadeInUp.delay(idx * 70 + 80).springify()}
              style={s.timelineItem}
            >
              {/* Timeline column */}
              <View style={s.timelineCol}>
                <View style={[s.timelineDot, { backgroundColor: meta.color }]} />
                {!isLast && <View style={[s.timelineLine, { backgroundColor: `${meta.color}30` }]} />}
              </View>

              {/* Meal card */}
              <View style={[s.mealCard, { flex: 1 }]}>
                <View style={[s.mealHeader, { backgroundColor: meta.bg }]}>
                  <View style={s.mealTitleRow}>
                    <View style={[s.mealIconBg, { backgroundColor: `${meta.color}20` }]}>
                      <MealIcon meal={meal} size={18} color={meta.color} />
                    </View>
                    <Text style={[s.mealTitle, { color: meta.color }]}>
                      {t(`food.meal_${meal}`)}
                    </Text>
                    {mealCals > 0 && (
                      <View style={[s.calPill, { backgroundColor: `${meta.color}20` }]}>
                        <Text style={[s.calPillText, { color: meta.color }]}>
                          {Math.round(mealCals)} kcal
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[s.addBtn, { backgroundColor: meta.color }]}
                    onPress={() => router.push({ pathname: '/(tabs)/food-log/search', params: { mealType: meal } })}
                  >
                    <PlusCircle size={18} weight="fill" color={C.white} />
                  </TouchableOpacity>
                </View>

                {mealLogs.length === 0 ? (
                  <View style={s.emptyMeal}>
                    <Text style={s.emptyText}>{t('food.meal_empty')}</Text>
                  </View>
                ) : (
                  <View>
                    {mealLogs.map((log, logIdx) => (
                      <View key={log.id} style={[s.foodRow, logIdx > 0 && s.foodRowBorder]}>
                        <View style={s.foodInfo}>
                          <Text style={s.foodName} numberOfLines={1}>{log.foodName}</Text>
                          {log.brandName && (
                            <Text style={s.brandName} numberOfLines={1}>{log.brandName}</Text>
                          )}
                          <View style={s.foodMacroRow}>
                            <Text style={s.macroPill}>{Math.round(Number(log.calories))} kcal</Text>
                            <Text style={[s.macroPill, { color: C.coral }]}>P {Math.round(Number(log.proteinG))}g</Text>
                            <Text style={[s.macroPill, { color: C.blue }]}>C {Math.round(Number(log.carbsG))}g</Text>
                            <Text style={[s.macroPill, { color: C.amber }]}>F {Math.round(Number(log.fatG))}g</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDelete(log.id, log.foodName)}
                          style={s.deleteBtn}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Trash size={16} weight="regular" color={C.coral} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },

  header: {
    backgroundColor: '#1A2B5C',
    paddingTop: 52,
    paddingBottom: 36,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },

  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navBtn:   { padding: 6 },
  datePill: { flex: 1, alignItems: 'center' },
  dateText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.2 },

  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryRight: { flex: 1, gap: 10 },

  budgetRow: { flexDirection: 'row', alignItems: 'baseline' },
  budgetValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  budgetLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },

  macrosCol: { gap: 8 },

  scroll:       { flex: 1 },
  scrollContent:{ paddingVertical: 16, paddingHorizontal: 16 },

  // Timeline
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  timelineCol:  { width: 20, alignItems: 'center', paddingTop: 20 },
  timelineDot:  { width: 12, height: 12, borderRadius: 6 },
  timelineLine: { width: 2, flex: 1, marginTop: 4 },

  mealCard: {
    backgroundColor: C.surface,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#1A2B5C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexShrink: 1, marginRight: 8 },
  mealIconBg:   { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mealTitle:    { fontSize: 15, fontWeight: '700' },
  calPill:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  calPillText:  { fontSize: 11, fontWeight: '700' },
  addBtn:       { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  emptyMeal: { paddingHorizontal: 16, paddingVertical: 14 },
  emptyText: { fontSize: 13, color: C.textSecondary, fontStyle: 'italic' },

  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  foodRowBorder: { borderTopWidth: 1, borderTopColor: C.border },
  foodInfo:  { flex: 1 },
  foodName:  { fontSize: 14, fontWeight: '600', color: C.textPrimary, marginBottom: 2 },
  brandName: { fontSize: 12, fontWeight: '500', color: C.textSecondary, marginBottom: 4 },
  foodMacroRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  macroPill: { fontSize: 11, fontWeight: '600', color: C.textSecondary },
  deleteBtn: { padding: 6 },
});
