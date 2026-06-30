import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CaretLeft, Plus, Trash } from 'phosphor-react-native';
import { colors, typography, spacing, radius, shadow } from '../constants/theme-new';
import { useTransformationStore } from '../stores/transformationStore';
import { useWeightStore } from '../stores/weightStore';

const C = colors;
const { width: SCREEN_W } = Dimensions.get('window');
const TILE_SIZE = (SCREEN_W - spacing.md * 2 - spacing.sm * 2) / 3;

export default function TransformationScreen() {
  const { photos, loadPhotos, addPhoto, deletePhoto } = useTransformationStore();
  const todayLog = useWeightStore((s) => s.todayLog);
  const [compareIds, setCompareIds] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [])
  );

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await addPhoto(result.assets[0].uri, todayLog?.weightKg ?? null);
    }
  };

  const toggleCompare = (id: number) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const comparePhotos = compareIds
    .map((id) => photos.find((p) => p.id === id))
    .filter(Boolean) as typeof photos;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <CaretLeft size={22} color={C.text} weight="bold" />
        </Pressable>
        <Text style={s.headerTitle}>Transformation</Text>
        <Pressable onPress={handleAddPhoto} style={s.backBtn}>
          <Plus size={22} color={C.primary} weight="bold" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {comparePhotos.length === 2 && (
          <View style={s.compareCard}>
            <Text style={s.sectionTitle}>Before / After</Text>
            <View style={s.compareRow}>
              {comparePhotos
                .slice()
                .sort((a, b) => a.dateStr.localeCompare(b.dateStr))
                .map((p) => (
                  <View key={p.id} style={s.compareTileWrap}>
                    <Image source={{ uri: p.photoUri }} style={s.compareTile} contentFit="cover" />
                    <Text style={s.compareLabel}>{p.dateStr}{p.weightKg ? ` · ${p.weightKg}kg` : ''}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {photos.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No progress photos yet. Add one to start your visual timeline.</Text>
          </View>
        ) : (
          <>
            <Text style={s.sectionTitle}>Tap two photos to compare</Text>
            <View style={s.grid}>
              {photos.map((photo) => {
                const selected = compareIds.includes(photo.id);
                return (
                  <Pressable
                    key={photo.id}
                    style={[s.tile, selected && s.tileSelected]}
                    onPress={() => toggleCompare(photo.id)}
                    onLongPress={() =>
                      Alert.alert('Delete photo?', undefined, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deletePhoto(photo.id) },
                      ])
                    }
                  >
                    <Image source={{ uri: photo.photoUri }} style={s.tileImage} contentFit="cover" />
                    <Text style={s.tileDate}>{photo.dateStr.slice(5)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  sectionTitle: { ...typography.label, color: C.textSecondary },
  empty: { paddingVertical: spacing['2xl'], alignItems: 'center' },
  emptyText: { ...typography.body, color: C.textSecondary, textAlign: 'center', maxWidth: 260 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: TILE_SIZE, borderRadius: radius.md, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  tileSelected: { borderColor: C.primary },
  tileImage: { width: TILE_SIZE, height: TILE_SIZE * 1.2, backgroundColor: C.borderLight },
  tileDate: { ...typography.caption, color: C.textSecondary, textAlign: 'center', marginTop: 2 },
  compareCard: { backgroundColor: C.surface, borderRadius: radius.xl, padding: spacing.md, ...shadow.sm, gap: spacing.sm },
  compareRow: { flexDirection: 'row', gap: spacing.sm },
  compareTileWrap: { flex: 1 },
  compareTile: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: C.borderLight },
  compareLabel: { ...typography.caption, color: C.textSecondary, textAlign: 'center', marginTop: 4 },
});
