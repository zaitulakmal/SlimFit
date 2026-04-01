/**
 * Water tab — log daily water intake.
 * WATR-01: log water (tap +250ml, +500ml, or custom)
 * WATR-02: daily goal progress indicator
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors, spacing, typography } from '../../../constants/theme';
import { useWaterStore } from '../../../stores/waterStore';
import ProgressRing from '../../../components/common/ProgressRing';

const QUICK_AMOUNTS = [150, 250, 350, 500];

export default function WaterScreen() {
  const { t } = useTranslation();
  const { today, addWater, removeWater } = useWaterStore();
  const [customMl, setCustomMl] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useFocusEffect(
    useCallback(() => {
      useWaterStore.getState().loadToday();
    }, [])
  );

  const totalMl = today?.totalMl ?? 0;
  const goalMl = today?.goalMl ?? 2000;
  const progress = Math.min(totalMl / goalMl, 1);
  const remaining = Math.max(goalMl - totalMl, 0);
  const glasses = Math.floor(totalMl / 250);
  const goalGlasses = Math.floor(goalMl / 250);

  const handleAdd = async (ml: number) => {
    await addWater(ml);
  };

  const handleCustomAdd = async () => {
    const ml = parseInt(customMl, 10);
    if (isNaN(ml) || ml < 50 || ml > 2000) {
      Alert.alert('Invalid amount', 'Please enter between 50 and 2000 ml.');
      return;
    }
    await addWater(ml);
    setCustomMl('');
    setShowCustom(false);
  };

  const handleUndo = async () => {
    await removeWater(250);
  };

  const pct = Math.round(progress * 100);
  const ringColor = progress >= 1 ? colors.primary : colors.skyBlue;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>{t('water.title')}</Text>

      {/* Progress ring */}
      <View style={s.ringSection}>
        <ProgressRing
          progress={progress}
          size={180}
          strokeWidth={14}
          color={ringColor}
          backgroundColor={colors.border}
        >
          <View style={s.ringCenter}>
            <Text style={[s.ringValue, { color: ringColor }]}>
              {totalMl >= 1000
                ? `${(totalMl / 1000).toFixed(1)}L`
                : `${totalMl}ml`}
            </Text>
            <Text style={s.ringGoal}>of {goalMl >= 1000 ? `${goalMl / 1000}L` : `${goalMl}ml`}</Text>
            <Text style={s.ringPct}>{pct}%</Text>
          </View>
        </ProgressRing>

        <View style={s.statsRow}>
          <View style={s.stat}>
            <Ionicons name="water" size={20} color={colors.skyBlue} />
            <Text style={s.statValue}>{glasses}</Text>
            <Text style={s.statLabel}>{t('water.glasses')}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Ionicons name="flag-outline" size={20} color={colors.primary} />
            <Text style={s.statValue}>{goalGlasses}</Text>
            <Text style={s.statLabel}>{t('water.goal_glasses')}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={s.statValue}>{remaining >= 1000 ? `${(remaining / 1000).toFixed(1)}L` : `${remaining}ml`}</Text>
            <Text style={s.statLabel}>{t('water.remaining')}</Text>
          </View>
        </View>
      </View>

      {/* Motivational message */}
      {progress >= 1 ? (
        <View style={s.goalMet}>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          <Text style={s.goalMetText}>{t('water.goal_met')}</Text>
        </View>
      ) : null}

      {/* Quick-add buttons */}
      <View style={s.card}>
        <Text style={s.cardTitle}>{t('water.add_water')}</Text>
        <View style={s.quickRow}>
          {QUICK_AMOUNTS.map((ml) => (
            <TouchableOpacity
              key={ml}
              style={s.quickBtn}
              onPress={() => handleAdd(ml)}
              activeOpacity={0.75}
            >
              <Ionicons name="water" size={18} color={colors.skyBlue} />
              <Text style={s.quickBtnText}>+{ml}ml</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom amount */}
        {showCustom ? (
          <View style={s.customRow}>
            <TextInput
              style={s.customInput}
              placeholder="ml"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              value={customMl}
              onChangeText={setCustomMl}
              autoFocus
            />
            <TouchableOpacity style={s.customAdd} onPress={handleCustomAdd}>
              <Text style={s.customAddText}>{t('water.add')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.customCancel} onPress={() => setShowCustom(false)}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.customToggle} onPress={() => setShowCustom(true)}>
            <Ionicons name="add-circle-outline" size={18} color={colors.textSecondary} />
            <Text style={s.customToggleText}>{t('water.custom_amount')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Undo last entry */}
      {totalMl > 0 && (
        <TouchableOpacity style={s.undoBtn} onPress={handleUndo} activeOpacity={0.8}>
          <Ionicons name="arrow-undo-outline" size={16} color={colors.textSecondary} />
          <Text style={s.undoBtnText}>{t('water.undo_250')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  title: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.md },
  ringSection: { alignItems: 'center', marginBottom: spacing.lg },
  ringCenter: { alignItems: 'center' },
  ringValue: { ...typography.display },
  ringGoal: { ...typography.label, color: colors.textSecondary, marginTop: 2 },
  ringPct: { ...typography.label, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.md },
  stat: { alignItems: 'center', gap: spacing.xs },
  statValue: { ...typography.body, color: colors.textPrimary },
  statLabel: { ...typography.label, color: colors.textSecondary },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  goalMet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.selectedTint,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  goalMetText: { ...typography.body, color: colors.primary },
  card: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, marginBottom: spacing.md },
  cardTitle: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.sm },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickBtnText: { ...typography.body, color: colors.skyBlue },
  customRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  customInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    ...typography.body,
    color: colors.textPrimary,
  },
  customAdd: { backgroundColor: colors.skyBlue, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: 10 },
  customAddText: { ...typography.body, color: colors.textOnAccent },
  customCancel: { padding: spacing.xs },
  customToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  customToggleText: { ...typography.label, color: colors.textSecondary },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  undoBtnText: { ...typography.label, color: colors.textSecondary },
});
