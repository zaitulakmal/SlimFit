import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Fire, Clock, CheckCircle, Trash, X, Heart, Barbell, Leaf, Football, Lightning } from 'phosphor-react-native';
import React from 'react';

import { colors, spacing, typography, shadow, radius } from '../../constants/theme';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useProfileStore } from '../../stores/profileStore';
import { WORKOUT_TYPES, calcCaloriesBurned, type WorkoutType } from '../../data/workout-types';
import BottomNav from '../../components/BottomNav';

function WorkoutIcon({ category, size, color }: { category: string; size: number; color: string }) {
  const props = { size, color, weight: 'regular' as const };
  switch (category) {
    case 'cardio':      return <Heart {...props} />;
    case 'strength':    return <Barbell {...props} />;
    case 'flexibility': return <Leaf {...props} />;
    case 'sport':       return <Football {...props} />;
    default:            return <Lightning {...props} />;
  }
}

export default function ActivityScreen() {
  const { t } = useTranslation();
  const { todayWorkouts, totalBurned, loadToday, logWorkout, deleteWorkout } = useWorkoutStore();
  const profile = useProfileStore((s) => s.profile);

  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);
  const [duration, setDuration] = useState('30');
  const [filterCat, setFilterCat] = useState<string>('all');

  useFocusEffect(
    useCallback(() => {
      loadToday();
    }, [])
  );

  const weightKg = profile?.weightKg ?? 70;

  const handleLog = async () => {
    if (!selectedType) return;
    const mins = parseInt(duration) || 0;
    if (mins <= 0) {
      Alert.alert('', 'Enter a valid duration');
      return;
    }
    const burned = calcCaloriesBurned(selectedType.met, weightKg, mins);
    await logWorkout({
      dateStr: new Date().toISOString().split('T')[0],
      activityType: selectedType.id,
      durationMin: mins,
      caloriesBurned: burned,
    });
    setSelectedType(null);
    setDuration('30');
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Remove Workout', `Remove ${name}?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteWorkout(id) },
    ]);
  };

  const filteredTypes = filterCat === 'all'
    ? WORKOUT_TYPES
    : WORKOUT_TYPES.filter((w) => w.category === filterCat);

  const categories = ['all', 'cardio', 'strength', 'flexibility', 'sport'];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.screenTitle}>{t('activity.title')}</Text>

        <View style={s.summaryCard}>
          <View style={s.summaryItem}>
            <Fire size={22} weight="fill" color={colors.coral} />
            <Text style={[s.summaryValue, { color: colors.coral }]}>{totalBurned}</Text>
            <Text style={s.summaryLabel}>{t('activity.burned')}</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <Clock size={22} weight="regular" color={colors.primary} />
            <Text style={s.summaryValue}>
              {todayWorkouts.reduce((a, w) => a + w.durationMin, 0)}
            </Text>
            <Text style={s.summaryLabel}>{t('activity.minutes')}</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <CheckCircle size={22} weight="regular" color={colors.skyBlue} />
            <Text style={s.summaryValue}>{todayWorkouts.length}</Text>
            <Text style={s.summaryLabel}>{t('activity.sessions')}</Text>
          </View>
        </View>

        {todayWorkouts.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('activity.today_log')}</Text>
            {todayWorkouts.map((w) => {
              const def = WORKOUT_TYPES.find((x) => x.id === w.activityType);
              return (
                <View key={w.id} style={s.workoutRow}>
                  <WorkoutIcon category={def?.category ?? 'cardio'} size={20} color={colors.primary} />
                  <View style={s.workoutInfo}>
                    <Text style={s.workoutName}>{def?.name ?? w.activityType}</Text>
                    <Text style={s.workoutSub}>{w.durationMin} min · {w.caloriesBurned} kcal burned</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(w.id, def?.name ?? w.activityType)}>
                    <Trash size={18} weight="regular" color={colors.coral} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {selectedType && (
          <View style={s.confirmPanel}>
            <Text style={s.confirmTitle}>{selectedType.name}</Text>
            <Text style={s.confirmSub}>
              {calcCaloriesBurned(selectedType.met, weightKg, parseInt(duration) || 0)} kcal burned
            </Text>
            <View style={s.confirmRow}>
              <View style={s.durationRow}>
                <TextInput
                  style={s.durationInput}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <Text style={s.durationLabel}>{t('activity.minutes')}</Text>
              </View>
              <TouchableOpacity style={s.logBtn} onPress={handleLog}>
                <Text style={s.logBtnText}>{t('activity.log_btn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedType(null)} style={s.cancelBtn}>
                <X size={20} weight="bold" color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={s.sectionTitle}>{t('activity.pick_activity')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[s.catChip, filterCat === cat && s.catChipActive]}
              onPress={() => setFilterCat(cat)}
            >
              <Text style={[s.catChipText, filterCat === cat && s.catChipTextActive]}>
                {cat === 'all' ? t('activity.all') : t(`activity.cat_${cat}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.workoutGrid}>
          {filteredTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[s.workoutCard, selectedType?.id === type.id && s.workoutCardSelected]}
              onPress={() => {
                setSelectedType(type);
                setDuration('30');
              }}
            >
              <WorkoutIcon category={type.category} size={26} color={selectedType?.id === type.id ? colors.white : colors.primary} />
              <Text style={[s.workoutCardName, selectedType?.id === type.id && { color: colors.white }]} numberOfLines={2}>
                {type.name}
              </Text>
              <Text style={[s.workoutCardMet, selectedType?.id === type.id && { color: colors.white }]}>
                MET {type.met}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  screenTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.md },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadow.sm,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { ...typography.heading, color: colors.textPrimary },
  summaryLabel: { ...typography.label, color: colors.textSecondary },
  summaryDivider: { width: 1, height: 36, backgroundColor: colors.border },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.sm },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  workoutInfo: { flex: 1 },
  workoutName: { ...typography.body, color: colors.textPrimary },
  workoutSub: { ...typography.label, color: colors.textSecondary },
  confirmPanel: {
    backgroundColor: colors.selectedTint,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  confirmTitle: { ...typography.body, color: colors.textPrimary },
  confirmSub: { ...typography.label, color: colors.primary },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  durationInput: {
    ...typography.body,
    color: colors.textPrimary,
    width: 48,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
  durationLabel: { ...typography.label, color: colors.textSecondary },
  logBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: spacing.sm,
    alignItems: 'center',
  },
  logBtnText: { ...typography.body, color: colors.textOnAccent },
  cancelBtn: { padding: spacing.xs },
  catScroll: { marginBottom: spacing.sm },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { ...typography.label, color: colors.textSecondary },
  catChipTextActive: { color: colors.white },
  workoutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  workoutCard: {
    width: '30%',
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.sm,
  },
  workoutCardSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  workoutCardName: { ...typography.label, color: colors.textPrimary, textAlign: 'center' },
  workoutCardMet: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
});