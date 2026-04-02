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
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, spacing, typography } from '../../../constants/theme';
import { useFoodStore } from '../../../stores/foodStore';
import { useProfileStore } from '../../../stores/profileStore';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

const MEAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  breakfast: 'sunny-outline',
  lunch: 'partly-sunny-outline',
  dinner: 'moon-outline',
  snack: 'cafe-outline',
};

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = todayStr();
  const yesterday = offsetDate(today, -1);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function FoodLogScreen() {
  const { t } = useTranslation();
  const { dayLogs, currentDateStr, loadDayLogs, deleteFood, getTotals, getMealLogs } =
    useFoodStore();
  const profile = useProfileStore((s) => s.profile);

  useFocusEffect(
    useCallback(() => {
      loadDayLogs(currentDateStr);
    }, [currentDateStr])
  );

  const totals = getTotals();
  const tdee = profile?.tdee ?? 0;
  const remaining = Math.max(tdee - totals.calories, 0);
  const isOver = totals.calories > tdee && tdee > 0;

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
      {/* Recipes shortcut */}
      <TouchableOpacity
        style={s.recipesBtn}
        onPress={() => router.push('/(tabs)/food-log/recipes')}
      >
        <Ionicons name="restaurant-outline" size={16} color={colors.skyBlue} />
        <Text style={s.recipesBtnText}>{t('recipe.title')}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.skyBlue} />
      </TouchableOpacity>

      {/* Date navigation */}
      <View style={s.dateNav}>
        <TouchableOpacity onPress={() => navigateDate(-1)} style={s.navBtn} accessibilityLabel="Previous day">
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => loadDayLogs(todayStr())} style={s.datePill}>
          <Text style={s.dateText}>{formatDate(currentDateStr)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigateDate(1)}
          style={s.navBtn}
          disabled={currentDateStr >= todayStr()}
          accessibilityLabel="Next day"
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={currentDateStr >= todayStr() ? colors.border : colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Macros summary bar */}
      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={[s.summaryValue, isOver && { color: colors.amber }]}>
            {Math.round(totals.calories)}
          </Text>
          <Text style={s.summaryLabel}>{t('food.kcal')}</Text>
        </View>
        {tdee > 0 && (
          <>
            <View style={s.summaryDivider} />
            <View style={s.summaryItem}>
              <Text style={[s.summaryValue, { color: isOver ? colors.amber : colors.primary }]}>
                {isOver ? `+${Math.round(totals.calories - tdee)}` : remaining}
              </Text>
              <Text style={s.summaryLabel}>{t('home.remaining')}</Text>
            </View>
          </>
        )}
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={s.summaryValue}>{Math.round(totals.proteinG)}g</Text>
          <Text style={s.summaryLabel}>{t('food.protein')}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={s.summaryValue}>{Math.round(totals.carbsG)}g</Text>
          <Text style={s.summaryLabel}>{t('food.carbs')}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={s.summaryValue}>{Math.round(totals.fatG)}g</Text>
          <Text style={s.summaryLabel}>{t('food.fat')}</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {MEAL_TYPES.map((meal) => {
          const mealLogs = getMealLogs(meal);
          const mealCals = mealLogs.reduce((a, l) => a + l.calories, 0);

          return (
            <View key={meal} style={s.mealSection}>
              <View style={s.mealHeader}>
                <View style={s.mealTitleRow}>
                  <Ionicons name={MEAL_ICONS[meal]} size={18} color={colors.primary} />
                  <Text style={s.mealTitle}>{t(`food.meal_${meal}`)}</Text>
                  {mealCals > 0 && (
                    <Text style={s.mealCalories}>{Math.round(mealCals)} kcal</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={s.addBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/food-log/search',
                      params: { mealType: meal },
                    })
                  }
                  accessibilityLabel={`Add food to ${meal}`}
                >
                  <Ionicons name="add-circle" size={26} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {mealLogs.length === 0 ? (
                <Text style={s.emptyMeal}>{t('food.meal_empty')}</Text>
              ) : (
                mealLogs.map((log) => (
                  <View key={log.id} style={s.foodRow}>
                    <View style={s.foodInfo}>
                      <Text style={s.foodName} numberOfLines={1}>
                        {log.foodName}
                      </Text>
                      {log.brandName ? (
                        <Text style={s.brandName} numberOfLines={1}>
                          {log.brandName}
                        </Text>
                      ) : null}
                      <Text style={s.foodMacros}>
                        {log.servingQty} {log.servingUnit} · {Math.round(log.calories)} kcal · P{' '}
                        {Math.round(log.proteinG)}g · C {Math.round(log.carbsG)}g · F{' '}
                        {Math.round(log.fatG)}g
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(log.id, log.foodName)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.coral} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navBtn: { padding: spacing.xs },
  datePill: { flex: 1, alignItems: 'center' },
  dateText: { ...typography.body, color: colors.textPrimary },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { ...typography.body, color: colors.textPrimary },
  summaryLabel: { ...typography.label, color: colors.textSecondary },
  summaryDivider: { width: 1, height: 32, backgroundColor: colors.border, alignSelf: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  mealSection: {
    backgroundColor: colors.background,
    borderRadius: 14,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  mealTitle: { ...typography.body, color: colors.textPrimary },
  mealCalories: { ...typography.label, color: colors.textSecondary, marginLeft: spacing.xs },
  addBtn: { padding: spacing.xs },
  emptyMeal: {
    ...typography.label,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  foodInfo: { flex: 1 },
  foodName: { ...typography.body, color: colors.textPrimary },
  brandName: { ...typography.label, color: colors.textSecondary },
  foodMacros: { ...typography.label, color: colors.textSecondary, marginTop: 2 },
  recipesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recipesBtnText: { ...typography.label, color: colors.skyBlue, flex: 1 },
});
