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
import Svg, { Circle as SvgCircle, Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
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
        <RadialGradient id="foodHeaderGrad" cx="50%" cy="0%" r="100%">
          <Stop offset="0%" stopColor={C.headerTop} />
          <Stop offset="100%" stopColor={C.headerBottom} />
        </RadialGradient>
      </Defs>
      <Rect width={W} height={220} fill="url(#foodHeaderGrad)" />
      
      {/* Decorative circles */}
      <SvgCircle cx={W * 0.1} cy={-20} r={60} fill={C.white} opacity={0.15} />
      <SvgCircle cx={W * 0.9} cy={-30} r={80} fill={C.white} opacity={0.12} />
      <SvgCircle cx={W * 0.7} cy={200} r={50} fill={C.white} opacity={0.1} />
      
      {/* Apple decoration */}
      <SvgCircle cx={40} cy={180} r={20} fill="#FF8A80" opacity={0.8} />
      <Rect x={38} y={156} width={4} height={8} rx={2} fill={C.primary} />
      
      {/* Grape decoration */}
      <SvgCircle cx={W - 50} cy={160} r={8} fill="#CE93D8" />
      <SvgCircle cx={W - 35} cy={155} r={8} fill="#BA68C8" />
      <SvgCircle cx={W - 50} cy={170} r={8} fill="#CE93D8" />
      <SvgCircle cx={W - 35} cy={170} r={8} fill="#AB47BC" />
      
      {/* Strawberry decoration */}
      <SvgCircle cx={60} cy={60} r={18} fill="#FF8A80" />
      <SvgCircle cx={55} cy={52} r={2} fill="#FFF59D" />
      <SvgCircle cx={65} cy={54} r={2} fill="#FFF59D" />
      
      {/* Carrot decoration */}
      <Path d={`M${W - 80},100 L${W - 60},140 L${W - 100},140 Z`} fill="#FFB74D" />
      
      {/* Wavy bottom */}
      <Path d={`M0,195 Q${W * 0.3},220 ${W * 0.5},205 Q${W * 0.7},190 ${W},210 L${W},220 L0,220 Z`} fill={C.background} />
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
  const ringColor = isOver ? C.coral : C.primary;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <SvgCircle cx={center} cy={center} r={r} stroke="rgba(255,255,255,0.3)" strokeWidth={strokeWidth} fill="none" />
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
        <Text style={{ fontSize: 16, fontWeight: '800', color: ringColor }}>
          {Math.round(consumed)}
        </Text>
        <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>kcal</Text>
      </View>
    </View>
  );
}

function InlineMacro({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(value / target, 1) * 100 : 0;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.8)' }}>{label}</Text>
        <Text style={{ fontSize: 10, fontWeight: '700', color: C.white }}>{Math.round(value)}g</Text>
      </View>
      <View style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
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
  const tdee = Number(profile?.tdee) || 0;
  const remaining = Math.max(tdee - totals.calories, 0);
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
            <CaretLeft size={22} weight="bold" color={C.white} />
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
              color={currentDateStr >= todayStr() ? 'rgba(255,255,255,0.3)' : C.white}
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).springify()} style={s.summaryRow}>
          <CalorieRing consumed={totals.calories} tdee={tdee} />
          <View style={s.summaryRight}>
            {tdee > 0 && (
              <View style={s.budgetRow}>
                <Text style={[s.budgetValue, { color: isOver ? C.coral : C.white }]}>
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

          return (
            <Animated.View
              key={meal}
              entering={FadeInUp.delay(idx * 70 + 80).springify()}
              style={s.mealCard}
            >
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
    backgroundColor: C.primary,
    paddingTop: 52,
    paddingBottom: 32,
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
  dateText: { fontSize: 17, fontWeight: '700', color: C.white, letterSpacing: -0.2 },

  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryRight: { flex: 1, gap: 10 },

  budgetRow: { flexDirection: 'row', alignItems: 'baseline' },
  budgetValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  budgetLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },

  macrosCol: { gap: 8 },

  scroll:       { flex: 1 },
  scrollContent:{ padding: 16, gap: 12 },

  mealCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealIconBg:   { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mealTitle:    { fontSize: 15, fontWeight: '700' },
  calPill:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  calPillText:  { fontSize: 11, fontWeight: '700' },
  addBtn:       { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  emptyMeal: { paddingHorizontal: 16, paddingVertical: 14 },
  emptyText: { fontSize: 13, color: C.textSecondary, fontStyle: 'italic' },

  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
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
