/**
 * Garden — Slimora gamification tab.
 *
 * Plant cute vegetables from the "99 vegetables & herbs" pack, water them so
 * they grow, and harvest ripe crops for points. Two cats from CatPackFree
 * (Mochi + Draco) idle-animate and can be petted to raise affection.
 *
 * State lives in the Zustand gameStore (persisted to AsyncStorage).
 */
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  Plant,
  Drop,
  Scissors,
  Heart,
  Sparkle,
  FlowerLotus,
  ArrowCounterClockwise,
} from 'phosphor-react-native';
import { cute, radius, cuteShadow, cardTints, cardBorder, withAlpha } from '@/theme/cute';
import { useGameStore, type Plot } from '@/stores/gameStore';
import { VEG, getVeg, CATS, getCat } from '@/components/game/vegAssets';
import { Sprite } from '@/components/game/Sprite';
import { Image } from 'expo-image';

const STAGE_LABEL: Record<Plot['stage'], string> = {
  empty: 'Empty',
  seed: 'Seed',
  sprout: 'Sprout',
  growing: 'Growing',
  ripe: 'Ripe!',
};

function PlotCard({ plot }: { plot: Plot }) {
  const { t } = useTranslation();
  const plant = useGameStore((s) => s.plant);
  const waterPlot = useGameStore((s) => s.waterPlot);
  const harvest = useGameStore((s) => s.harvest);
  const [pickerOpen, setPickerOpen] = useState(false);
  const veg = getVeg(plot.vegKey);

  return (
    <View style={[styles.plotCard, cuteShadow.sm]}>
      <View style={styles.plotTop}>
        <Text style={styles.plotTitle}>{t('garden.plot', { n: plot.index + 1 })}</Text>
        <View
          style={[
            styles.stageChip,
            { backgroundColor: plot.stage === 'ripe' ? cute.mint : withAlpha(cute.ink, 0.06) },
          ]}
        >
          <Text style={[styles.stageChipText, plot.stage === 'ripe' && { color: '#fff' }]}>
            {STAGE_LABEL[plot.stage]}
          </Text>
        </View>
      </View>

      <View style={styles.plotSoil}>
        {veg ? (
          <Image source={veg.src} style={plotStageStyle(plot.stage)} contentFit="contain" />
        ) : (
          <Plant size={34} color={withAlpha(cute.ink, 0.25)} weight="light" />
        )}
      </View>

      {/* water bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.round(plot.water * 100)}%`, backgroundColor: cute.sky }]} />
      </View>

      <View style={styles.plotActions}>
        {!veg ? (
          <TouchableOpacity style={styles.btnPrimary} onPress={() => setPickerOpen((o) => !o)}>
            <Plant size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>{t('garden.plant')}</Text>
          </TouchableOpacity>
        ) : plot.stage === 'ripe' ? (
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: cute.mintDeep }]} onPress={() => harvest(plot.index)}>
            <Scissors size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>{t('garden.harvest')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: cute.sky }]} onPress={() => waterPlot(plot.index)}>
            <Drop size={16} color="#fff" />
            <Text style={styles.btnPrimaryText}>{t('garden.water')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {pickerOpen && !veg && (
        <View style={styles.vegPicker}>
          <FlatList
            data={VEG}
            numColumns={4}
            keyExtractor={(v) => v.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.vegCell}
                onPress={() => {
                  plant(plot.index, item.key);
                  setPickerOpen(false);
                }}
              >
                <Image source={item.src} style={styles.vegThumb} contentFit="contain" />
                <Text style={styles.vegName} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

function plotStageStyle(stage: Plot['stage']) {
  switch (stage) {
    case 'seed':
      return { width: 26, height: 26, opacity: 0.55 };
    case 'sprout':
      return { width: 40, height: 40, opacity: 0.8 };
    case 'growing':
      return { width: 56, height: 56 };
    case 'ripe':
      return { width: 66, height: 66 };
    default:
      return { width: 40, height: 40 };
  }
}

function CatCard({ catKey }: { catKey: string }) {
  const { t } = useTranslation();
  const cat = getCat(catKey)!;
  const catState = useGameStore((s) => s.cats.find((c) => c.key === catKey));
  const petCat = useGameStore((s) => s.petCat);
  const affection = catState?.affection ?? 0;

  return (
    <View style={[styles.catCard, cuteShadow.sm]}>
      <View style={styles.catSpriteWrap}>
        <Sprite src={cat.src} frames={cat.frames} frameW={cat.frameW} frameH={cat.frameH} scale={3} fps={7} />
      </View>
      <Text style={styles.catName}>{cat.name}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${affection}%`, backgroundColor: cute.coral }]} />
      </View>
      <Text style={styles.catAffection}>{t('garden.affection')}: {affection}%</Text>
      <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: cute.blush }]} onPress={() => petCat(catKey)}>
        <Heart size={16} color="#fff" weight="fill" />
        <Text style={styles.btnPrimaryText}>{t('garden.pet')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function GardenScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const plots = useGameStore((s) => s.plots);
  const score = useGameStore((s) => s.score);
  const harvests = useGameStore((s) => s.harvests);
  const tick = useGameStore((s) => s.tick);
  const reset = useGameStore((s) => s.reset);

  // Recompute growth whenever the tab is shown.
  useFocusEffect(
    useCallback(() => {
      tick();
    }, [tick]),
  );

  return (
    <View style={[styles.screen, { backgroundColor: cute.cream }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{t('garden.title')}</Text>
            <Text style={styles.headerSub}>{t('garden.subtitle')}</Text>
          </View>
          <View style={[styles.scoreChip, { backgroundColor: cardTints.butter, borderColor: withAlpha(cardBorder.butter, 0.5) }]}>
            <Sparkle size={18} color={cute.coralDeep} weight="fill" />
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>

        {/* Cats row */}
        <Text style={styles.sectionLabel}>
          <FlowerLotus size={16} color={cute.coral} /> {t('garden.cats')}
        </Text>
        <View style={styles.catRow}>
          {CATS.map((c) => (
            <CatCard key={c.key} catKey={c.key} />
          ))}
        </View>

        {/* Plots grid */}
        <Text style={styles.sectionLabel}>
          <Plant size={16} color={cute.mintDeep} /> {t('garden.your_patch')}
        </Text>
        <View style={styles.plotGrid}>
          {plots.map((p) => (
            <PlotCard key={p.index} plot={p} />
          ))}
        </View>

        <Text style={styles.harvestNote}>
          {t('garden.harvested', { n: harvests })}
        </Text>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() =>
            Alert.alert(t('garden.reset_title'), t('garden.reset_confirm'), [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('garden.reset'), style: 'destructive', onPress: reset },
            ])
          }
        >
          <ArrowCounterClockwise size={15} color={cute.inkSoft} />
          <Text style={styles.resetText}>{t('garden.reset')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  headerLeft: { flex: 1 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: cute.ink, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontWeight: '600', color: cute.inkSoft, marginTop: 2 },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  scoreText: { fontSize: 18, fontWeight: '800', color: cute.ink },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    fontSize: 16,
    fontWeight: '800',
    color: cute.ink,
    marginTop: 6,
  },
  catRow: { flexDirection: 'row', gap: 12 },
  catCard: {
    flex: 1,
    backgroundColor: cute.card,
    borderRadius: radius.lg,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  catSpriteWrap: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    backgroundColor: withAlpha(cute.lavender, 0.16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: { fontSize: 15, fontWeight: '800', color: cute.ink },
  catAffection: { fontSize: 11, fontWeight: '600', color: cute.inkSoft },
  plotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  plotCard: {
    width: '47.5%',
    backgroundColor: cute.card,
    borderRadius: radius.lg,
    padding: 12,
    gap: 8,
  },
  plotTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plotTitle: { fontSize: 13, fontWeight: '700', color: cute.ink },
  stageChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  stageChipText: { fontSize: 10, fontWeight: '700', color: cute.inkSoft },
  plotSoil: {
    height: 84,
    borderRadius: radius.md,
    backgroundColor: withAlpha(cute.peach, 0.18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTrack: { height: 7, borderRadius: radius.pill, backgroundColor: withAlpha(cute.ink, 0.08), overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill },
  plotActions: {},
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: cute.mintDeep,
    borderRadius: radius.md,
    paddingVertical: 9,
  },
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  vegPicker: {
    marginTop: 8,
    backgroundColor: withAlpha(cute.ink, 0.03),
    borderRadius: radius.md,
    padding: 8,
  },
  vegCell: { width: '25%', alignItems: 'center', paddingVertical: 6 },
  vegThumb: { width: 34, height: 34 },
  vegName: { fontSize: 9, fontWeight: '600', color: cute.inkSoft, marginTop: 2, textAlign: 'center' },
  harvestNote: { fontSize: 12, fontWeight: '600', color: cute.inkSoft, textAlign: 'center', marginTop: 4 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
  },
  resetText: { fontSize: 13, fontWeight: '700', color: cute.inkSoft },
});
