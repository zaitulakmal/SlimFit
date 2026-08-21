import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { pastelColors, pastelSpacing, pastelRadius, mealColors } from '../../../constants/pastel-theme';
import { cute, radius, withAlpha, cardTints, cardBorder } from '@/theme/cute';
import { useFoodStore } from '../../../stores/foodStore';
import { useProfileStore } from '../../../stores/profileStore';
import { calculateCalorieTarget } from '../../../constants/tdee';
import type { GoalType } from '../../../constants/tdee';

const RF = (v: number) => Math.round(v);
const C = pastelColors;

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

// Meal -> shared card tint, so Food Log uses the same card family as Home and
// Profile (saturated fill, deeper border, xl corners, no shadow).
const MEAL_TINT = {
  breakfast: 'butter',
  lunch: 'mint',
  dinner: 'lavender',
  snack: 'peach',
} as const;

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


function CalorieRing({ consumed, tdee }: { consumed: number; tdee: number }) {
  const size = 84;
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = tdee > 0 ? Math.min(consumed / tdee, 1) : 0;
  const offset = circ * (1 - pct);
  const center = size / 2;
  const isOver = consumed > tdee && tdee > 0;
  const ringColor = isOver ? '#FF6B6B' : '#FFC53D';

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <SvgCircle cx={center} cy={center} r={r} stroke={cute.line} strokeWidth={strokeWidth} fill="none" />
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
        <Text style={{ fontSize: 16, fontWeight: '800', color: cute.ink }}>
          {Math.round(consumed)}
        </Text>
        <Text style={{ fontSize: 9, color: cute.inkSoft, fontWeight: '600' }}>kcal</Text>
      </View>
    </View>
  );
}

function InlineMacro({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(value / target, 1) * 100 : 0;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: '600', color: cute.inkSoft }}>{label}</Text>
        <Text style={{ fontSize: 10, fontWeight: '700', color: cute.ink }}>{Math.round(value)}g</Text>
      </View>
      <View style={{ height: 5, borderRadius: 3, backgroundColor: cute.line, overflow: 'hidden' }}>
        <View style={{ height: 5, borderRadius: 3, backgroundColor: color, width: `${pct}%` }} />
      </View>
    </View>
  );
}

export default function FoodLogScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
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
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Animated.View entering={FadeInDown.delay(0).springify()} style={s.dateNav}>
          <TouchableOpacity onPress={() => navigateDate(-1)} style={s.navBtn}>
            <CaretLeft size={22} weight="bold" color={cute.ink} />
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
              color={currentDateStr >= todayStr() ? cute.inkFaint : cute.ink}
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).springify()} style={s.summaryCard}>
          <CalorieRing consumed={totals.calories} tdee={tdee} />
          <View style={s.summaryRight}>
            {tdee > 0 && (
              <View style={s.budgetRow}>
                <Text style={[s.budgetValue, { color: isOver ? cute.danger : cute.ink }]}>
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
        contentContainerStyle={[s.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {MEAL_TYPES.map((meal, idx) => {
          const mealLogs   = getMealLogs(meal);
          const mealCals   = mealLogs.reduce((a, l) => a + Number(l.calories), 0);
          const meta       = mealColors[meal];
          const tint       = MEAL_TINT[meal];
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
              <View
                style={[
                  s.mealCard,
                  { flex: 1, backgroundColor: cardTints[tint], borderColor: withAlpha(cardBorder[tint], 0.5) },
                ]}
              >
                <View style={s.mealHeader}>
                  <View style={s.mealTitleRow}>
                    <View style={s.mealIconBg}>
                      <MealIcon meal={meal} size={20} color="#FFFFFF" />
                    </View>
                    <Text style={s.mealTitle}>{t(`food.meal_${meal}`)}</Text>
                    {mealCals > 0 && (
                      <View style={s.calPill}>
                        <Text style={s.calPillText}>{Math.round(mealCals)} kcal</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={s.addBtn}
                    onPress={() => router.push({ pathname: '/(tabs)/food-log/search', params: { mealType: meal } })}
                  >
                    <PlusCircle size={18} weight="fill" color="#FFFFFF" />
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
                        <View style={s.foodCalBadge}>
                          <Text style={s.foodCalBadgeText}>{Math.round(Number(log.calories))}</Text>
                          <Text style={s.foodCalUnit}>kcal</Text>
                        </View>
                        <View style={s.foodInfo}>
                          <Text style={s.foodName} numberOfLines={1}>{log.foodName}</Text>
                          {log.brandName && (
                            <Text style={s.brandName} numberOfLines={1}>{log.brandName}</Text>
                          )}
                          <View style={s.foodMacroRow}>
                            <Text style={[s.macroPill, { color: C.coral }]}>P {Math.round(Number(log.proteinG))}g</Text>
                            <Text style={[s.macroPill, { color: '#7B5B00' }]}>C {Math.round(Number(log.carbsG))}g</Text>
                            <Text style={[s.macroPill, { color: '#C05A1B' }]}>F {Math.round(Number(log.fatG))}g</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDelete(log.id, log.foodName)}
                          style={s.deleteBtn}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Trash size={16} weight="regular" color={withAlpha(cute.ink, 0.55)} />
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
  root: { flex: 1, backgroundColor: '#FAF4E4' },

  header: {
    // paddingTop comes from the safe-area inset so the date row clears the notch.
    backgroundColor: 'transparent',
    paddingBottom: 8,
    paddingHorizontal: 18,
  },

  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navBtn:   { padding: 6 },
  datePill: { flex: 1, alignItems: 'center' },
  dateText: { fontSize: 17, fontWeight: '700', color: cute.ink, letterSpacing: -0.2 },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: cute.card,
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: cute.line,
  },
  summaryRight: { flex: 1, gap: 10 },

  budgetRow: { flexDirection: 'row', alignItems: 'baseline' },
  budgetValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  budgetLabel: { fontSize: 13, fontWeight: '600', color: cute.inkSoft },

  macrosCol: { gap: 8 },

  scroll:       { flex: 1 },
  scrollContent:{ paddingVertical: 16, paddingHorizontal: 16 },

  // Timeline
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  timelineCol:  { width: 20, alignItems: 'center', paddingTop: 20 },
  timelineDot:  { width: 12, height: 12, borderRadius: 6 },
  timelineLine: { width: 2, flex: 1, marginTop: 4 },

  mealCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexShrink: 1, marginRight: 8 },
  mealIconBg:   { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: cute.action },
  mealTitle:    { fontSize: 15, fontWeight: '800', color: cute.ink },
  calPill:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: withAlpha('#FFFFFF', 0.6) },
  calPillText:  { fontSize: 11, fontWeight: '800', color: cute.ink },
  addBtn:       { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: cute.action },

  emptyMeal: { paddingHorizontal: 16, paddingVertical: 14 },
  emptyText: { fontSize: 13, color: withAlpha(cute.ink, 0.6), fontStyle: 'italic' },

  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  foodRowBorder: { borderTopWidth: 1, borderTopColor: withAlpha('#FFFFFF', 0.55) },
  foodInfo:  { flex: 1 },
  foodName:  { fontSize: 14, fontWeight: '600', color: cute.ink, marginBottom: 2 },
  brandName: { fontSize: 12, fontWeight: '500', color: cute.inkSoft, marginBottom: 4 },
  foodMacroRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  macroPill: { fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: 6 },
  foodCalBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 52,
    backgroundColor: withAlpha('#FFFFFF', 0.7),
  },
  foodCalBadgeText: { fontSize: 14, fontWeight: '900', lineHeight: 16, color: cute.ink },
  foodCalUnit: { fontSize: 9, fontWeight: '700', marginTop: 1, color: withAlpha(cute.ink, 0.7) },
});
