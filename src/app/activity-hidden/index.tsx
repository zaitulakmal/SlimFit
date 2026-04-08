import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Fire, Clock, CheckCircle, Trash, X, Heart, Barbell, Leaf, Football, Lightning, Info, List } from 'phosphor-react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors as themeColors, spacing, typography, shadow, radius } from '../../constants/theme';
import { pastelColors } from '../../constants/pastel-theme';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useProfileStore } from '../../stores/profileStore';
import { WORKOUT_TYPES, calcCaloriesBurned, type WorkoutType } from '../../data/workout-types';
import BottomNav from '../../components/BottomNav';

const { width: W } = Dimensions.get('window');
const C = pastelColors;
import { Dimensions } from 'react-native';

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

function WorkoutInstructionsModal({ 
  workout, 
  visible, 
  onClose 
}: { 
  workout: WorkoutType | null; 
  visible: boolean; 
  onClose: () => void;
}) {
  const { t } = useTranslation();
  
  if (!workout) return null;
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <View style={s.modalHeader}>
            <View style={s.modalTitleRow}>
              <WorkoutIcon category={workout.category} size={24} color={C.primary} />
              <Text style={s.modalTitle}>{workout.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.modalClose}>
              <X size={24} weight="bold" color={C.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={s.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={s.instructionSection}>
              <View style={s.instructionHeader}>
                <List size={18} weight="bold" color={C.primary} />
                <Text style={s.instructionTitle}>How to do it:</Text>
              </View>
              {workout.instructions.map((instruction, index) => (
                <View key={index} style={s.instructionItem}>
                  <View style={[s.instructionNumber, { backgroundColor: C.cardMint }]}>
                    <Text style={s.instructionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={s.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
            
            <View style={[s.instructionSection, { backgroundColor: C.cardYellow }]}>
              <View style={s.instructionHeader}>
                <Lightning size={18} weight="bold" color="#E6A700" />
                <Text style={[s.instructionTitle, { color: '#8B6914' }]}>Tips:</Text>
              </View>
              {workout.tips.map((tip, index) => (
                <View key={index} style={s.tipItem}>
                  <Text style={s.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          
          <TouchableOpacity style={s.modalDoneBtn} onPress={onClose}>
            <Text style={s.modalDoneText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ActivityScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { todayWorkouts, totalBurned, loadToday, logWorkout, deleteWorkout } = useWorkoutStore();
  const profile = useProfileStore((s) => s.profile);

  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);
  const [duration, setDuration] = useState('30');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [showInstructions, setShowInstructions] = useState(false);

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
    <View style={s.root}>
      <ScrollView style={s.scrollView} contentContainerStyle={[s.content, { paddingTop: insets.top + 20, paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        <Text style={s.screenTitle}>Activity</Text>

        {/* Summary card */}
        <View style={s.summaryCard}>
          <View style={s.summaryItem}>
            <Fire size={24} weight="fill" color={C.coral} />
            <Text style={[s.summaryValue, { color: C.coral }]}>{totalBurned}</Text>
            <Text style={s.summaryLabel}>Calories Burned</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <Clock size={24} weight="regular" color={C.primary} />
            <Text style={s.summaryValue}>
              {todayWorkouts.reduce((a, w) => a + Number(w.durationMin), 0)}
            </Text>
            <Text style={s.summaryLabel}>Minutes</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <CheckCircle size={24} weight="regular" color={C.blue} />
            <Text style={s.summaryValue}>{todayWorkouts.length}</Text>
            <Text style={s.summaryLabel}>Sessions</Text>
          </View>
        </View>

        {/* Today's workouts */}
        {todayWorkouts.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Today's Workouts</Text>
            {todayWorkouts.map((w) => {
              const def = WORKOUT_TYPES.find((x) => x.id === w.activityType);
              return (
                <View key={w.id} style={s.workoutRow}>
                  <WorkoutIcon category={def?.category ?? 'cardio'} size={22} color={C.primary} />
                  <View style={s.workoutInfo}>
                    <Text style={s.workoutName}>{def?.name ?? w.activityType}</Text>
                    <Text style={s.workoutSub}>{w.durationMin} min · {w.caloriesBurned} kcal</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(w.id, def?.name ?? w.activityType)}>
                    <Trash size={18} weight="regular" color={C.coral} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Category filter */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Select Activity</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[s.catChip, filterCat === cat && s.catChipActive]}
                onPress={() => setFilterCat(cat)}
              >
                <Text style={[s.catChipText, filterCat === cat && s.catChipTextActive]}>
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Workout grid */}
          <View style={s.workoutGrid}>
            {filteredTypes.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={[s.workoutCard, selectedType?.id === workout.id && s.workoutCardSelected]}
                onPress={() => setSelectedType(workout)}
              >
                <WorkoutIcon category={workout.category} size={24} color={selectedType?.id === workout.id ? C.white : C.primary} />
                <Text style={[s.workoutCardName, selectedType?.id === workout.id && { color: C.white }]}>
                  {workout.name}
                </Text>
                <Text style={[s.workoutCardMet, selectedType?.id === workout.id && { color: 'rgba(255,255,255,0.8)' }]}>
                  {workout.met} MET
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info button */}
        {selectedType && (
          <TouchableOpacity 
            style={s.infoBtn}
            onPress={() => setShowInstructions(true)}
          >
            <Info size={18} weight="bold" color={C.primary} />
            <Text style={s.infoBtnText}>How to do {selectedType.name}</Text>
          </TouchableOpacity>
        )}

        {/* Duration input */}
        {selectedType && (
          <View style={s.durationSection}>
            <Text style={s.durationLabel}>Duration (minutes)</Text>
            <View style={s.durationRow}>
              <TouchableOpacity 
                style={s.durationBtn}
                onPress={() => setDuration(String(Math.max(1, parseInt(duration) - 5)))}
              >
                <Text style={s.durationBtnText}>-5</Text>
              </TouchableOpacity>
              <TextInput
                style={s.durationInput}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                placeholderTextColor={C.textTertiary}
              />
              <TouchableOpacity 
                style={s.durationBtn}
                onPress={() => setDuration(String(parseInt(duration) + 5))}
              >
                <Text style={s.durationBtnText}>+5</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={s.logBtn} onPress={handleLog}>
              <Text style={s.logBtnText}>Log Workout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Instructions modal */}
      <WorkoutInstructionsModal 
        workout={selectedType}
        visible={showInstructions}
        onClose={() => setShowInstructions(false)}
      />

      <BottomNav />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  scrollView: { flex: 1 },
  content: { padding: 20 },
  screenTitle: { fontSize: 28, fontWeight: '800', color: C.textPrimary, marginBottom: 20 },
  
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 8 },
  summaryValue: { fontSize: 24, fontWeight: '800', color: C.textPrimary },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  summaryDivider: { width: 1, backgroundColor: C.border },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, marginBottom: 12 },
  
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  workoutInfo: { flex: 1 },
  workoutName: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  workoutSub: { fontSize: 12, fontWeight: '500', color: C.textSecondary, marginTop: 2 },
  
  catScroll: { marginBottom: 16 },
  catChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 10,
    backgroundColor: C.white,
  },
  catChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  catChipText: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
  catChipTextActive: { color: C.white },
  
  workoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  workoutCard: {
    width: '30%',
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  workoutCardSelected: { backgroundColor: C.primary, borderColor: C.primary },
  workoutCardName: { fontSize: 12, fontWeight: '600', color: C.textPrimary, textAlign: 'center', marginTop: 8 },
  workoutCardMet: { fontSize: 10, fontWeight: '500', color: C.textSecondary, marginTop: 4 },
  
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.cardMint,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  infoBtnText: { fontSize: 15, fontWeight: '600', color: C.primary },
  
  durationSection: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  durationLabel: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 12, textAlign: 'center' },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  durationBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.cardBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBtnText: { fontSize: 18, fontWeight: '700', color: C.blue },
  durationInput: {
    width: 80,
    height: 56,
    backgroundColor: C.background,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: C.textPrimary,
  },
  logBtn: {
    backgroundColor: C.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  logBtnText: { fontSize: 16, fontWeight: '700', color: C.white },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  modalClose: { padding: 4 },
  modalScroll: { maxHeight: 400 },
  instructionSection: {
    backgroundColor: C.cardBlue,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  instructionTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: { fontSize: 12, fontWeight: '700', color: C.primary },
  instructionText: { flex: 1, fontSize: 14, color: C.textPrimary, lineHeight: 20 },
  tipItem: {
    paddingLeft: 28,
    marginBottom: 6,
  },
  tipText: { fontSize: 14, color: '#8B6914', lineHeight: 20 },
  modalDoneBtn: {
    backgroundColor: C.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalDoneText: { fontSize: 16, fontWeight: '700', color: C.white },
});
