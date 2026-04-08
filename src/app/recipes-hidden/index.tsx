/**
 * Recipes screen — Duolingo-style redesign.
 * Keeps all existing data/logic, only UI layer changed.
 */

import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, FlatList, StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Clock, Users, CaretUp, CaretDown, Lightbulb, MagnifyingGlass,
  GridFour, Sun, CloudSun, Moon, Coffee, Drop, ForkKnife, BookOpen,
} from 'phosphor-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
} from 'react-native-reanimated';
import React from 'react';

import { colors, spacing, typography, shadow, radius, animation } from '../../constants/theme-new';
import { pastelColors } from '../../constants/pastel-theme';
import { RECIPES, searchRecipes, type Recipe } from '../../data/recipes';
import BottomNav from '../../components/BottomNav';

type Category = 'all' | Recipe['category'];

const CATS: { key: Category; Icon: React.ComponentType<{ size: number; color: string; weight?: string }> }[] = [
  { key: 'all',       Icon: GridFour as any },
  { key: 'breakfast', Icon: Sun as any },
  { key: 'lunch',     Icon: CloudSun as any },
  { key: 'dinner',    Icon: Moon as any },
  { key: 'snack',     Icon: Coffee as any },
  { key: 'drink',     Icon: Drop as any },
];

const CAT_BG: Record<string, string> = {
  breakfast: '#FFF8E1',
  lunch:     colors.primarySubtle,
  dinner:    colors.purpleMuted,
  snack:     colors.accentMuted,
  drink:     colors.secondaryMuted,
  all:       colors.borderLight,
};

const CAT_COLOR: Record<string, string> = {
  breakfast: colors.accent,
  lunch:     colors.primary,
  dinner:    colors.purple,
  snack:     colors.accent,
  drink:     colors.secondary,
  all:       colors.text,
};

const DIFF_COLOR: Record<string, string> = {
  easy:   colors.primary,
  medium: colors.accent,
};

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[pill.wrap, { backgroundColor: color + '15' }]}>
      <Text style={[pill.val, { color }]}>{value}</Text>
      <Text style={pill.lbl}>{label}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.md },
  val:  { ...typography.body, fontWeight: '700' },
  lbl:  { ...typography.micro, color: colors.textSecondary },
});

// Animated recipe card
function RecipeCard({ recipe, index }: { recipe: Recipe; index: number }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const totalMin = recipe.prepMin + recipe.cookMin;
  const catColor = CAT_COLOR[recipe.category] ?? colors.primary;
  const catBg    = CAT_BG[recipe.category] ?? colors.borderLight;
  const scale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 60).springify()}
      style={[{ overflow: 'hidden', borderRadius: radius.xl }, cardStyle]}
    >
      <TouchableOpacity
        style={s.card}
        onPress={() => setOpen((v) => !v)}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 12, stiffness: 200 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 180 }); }}
        activeOpacity={1}
      >
        {/* Category banner */}
        <View style={[s.cardBanner, { backgroundColor: catBg }]}>
          <Text style={[s.cardCat, { color: catColor }]}>
            {t(`food.meal_${recipe.category}`, { defaultValue: recipe.category })}
          </Text>
          <View style={[s.diffBadge, { backgroundColor: (DIFF_COLOR[recipe.difficulty] ?? colors.primary) + '20' }]}>
            <Text style={[s.diffText, { color: DIFF_COLOR[recipe.difficulty] ?? colors.primary }]}>
              {recipe.difficulty}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={s.cardBody}>
          <View style={s.nameRow}>
            <View style={s.nameWrap}>
              <Text style={s.cardName}>{recipe.name}</Text>
              <Text style={s.cardNameMy}>{recipe.nameMy}</Text>
            </View>
            <View style={[s.forkIcon, { backgroundColor: catBg }]}>
              <ForkKnife size={20} weight="fill" color={catColor} />
            </View>
          </View>

          {/* Meta row */}
          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <Clock size={14} weight="fill" color={colors.textSecondary} />
              <Text style={s.metaText}>{totalMin} min</Text>
            </View>
            <View style={s.metaItem}>
              <Users size={14} weight="fill" color={colors.textSecondary} />
              <Text style={s.metaText}>{recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Macro pills */}
          <View style={s.macroRow}>
            <MacroPill label="kcal"    value={String(recipe.calories)} color={colors.danger} />
            <MacroPill label="Protein" value={`${recipe.proteinG}g`}  color={colors.primary} />
            <MacroPill label="Carbs"   value={`${recipe.carbsG}g`}    color={colors.accent} />
            <MacroPill label="Fat"     value={`${recipe.fatG}g`}      color={colors.textSecondary} />
          </View>

          {/* Tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tagScroll}>
            {recipe.tags.map((tag) => (
              <View key={tag} style={[s.tagChip, { backgroundColor: catBg }]}>
                <Text style={[s.tagText, { color: catColor }]}>{tag}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Expand row */}
          <Animated.View style={s.expandRow}>
            <Text style={[s.expandHint, { color: colors.primary }]}>
              {open ? t('recipe.hide_detail') : t('recipe.see_detail')}
            </Text>
            <Animated.View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
              <CaretDown size={18} weight="bold" color={colors.primary} />
            </Animated.View>
          </Animated.View>

          {/* Expanded detail */}
          {open && (
            <Animated.View entering={FadeInDown.springify()} style={s.detail}>
              {recipe.tip ? (
                <View style={s.tipBox}>
                  <Lightbulb size={16} weight="fill" color={colors.primary} />
                  <Text style={s.tipText}>{recipe.tip}</Text>
                </View>
              ) : null}

              <View style={s.sectionHeader}>
                <BookOpen size={16} weight="fill" color={colors.primary} />
                <Text style={s.detailSection}>{t('recipe.ingredients')}</Text>
              </View>
              {recipe.ingredients.map((ing, i) => (
                <View key={`ing-${i}`} style={s.listRow}>
                  <View style={[s.bullet, { backgroundColor: catColor }]} />
                  <Text style={s.detailItem}>{ing}</Text>
                </View>
              ))}

              <View style={[s.sectionHeader, { marginTop: spacing.md }]}>
                <BookOpen size={16} weight="fill" color={colors.secondary} />
                <Text style={[s.detailSection, { color: colors.secondary }]}>{t('recipe.steps')}</Text>
              </View>
              {recipe.steps.map((step, i) => (
                <View key={`step-${i}`} style={s.stepRow}>
                  <View style={[s.stepNum, { backgroundColor: catBg }]}>
                    <Text style={[s.stepNumText, { color: catColor }]}>{i + 1}</Text>
                  </View>
                  <Text style={s.detailItem}>{step}</Text>
                </View>
              ))}
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  headerTitle: { ...typography.display, color: colors.text },
  headerSub:   { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.xl,
    ...shadow.sm,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.text, padding: 0 },
  searchPlaceholder: { color: colors.textPlaceholder },

  catRow:    { maxHeight: 48, marginBottom: spacing.sm },
  catContent:{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingRight: spacing.lg },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  catLabel: { ...typography.label, fontWeight: '600' },

  statsRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, marginBottom: spacing.sm },
  statsText: { ...typography.bodySm, color: colors.textSecondary },

  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', ...shadow.md },
  cardBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  cardCat:  { ...typography.label, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  diffBadge:{ paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  diffText: { ...typography.micro, fontWeight: '700' },

  cardBody: { padding: spacing.lg },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  nameWrap: { flex: 1 },
  cardName:   { ...typography.title, color: colors.text },
  cardNameMy: { ...typography.bodySm, color: colors.textSecondary, marginTop: 2 },
  forkIcon: {
    width: 44, height: 44, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', marginLeft: spacing.md,
  },

  metaRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  metaItem:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:{ ...typography.bodySm, color: colors.textSecondary },

  macroRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  tagScroll:  { marginBottom: spacing.sm },
  tagChip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.md, marginRight: spacing.xs },
  tagText: { ...typography.micro, fontWeight: '600' },

  expandRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  expandHint:{ ...typography.bodySm, fontWeight: '600' },

  detail: { marginTop: spacing.md, paddingTop: spacing.md, gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderLight },
  tipBox: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.primarySubtle, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.md,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  tipText: { ...typography.bodySm, color: colors.text, flex: 1, lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  detailSection: { ...typography.body, color: colors.primary, fontWeight: '700' },
  listRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: spacing.xs },
  bullet: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  stepRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start', marginBottom: spacing.sm },
  stepNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { ...typography.label, fontWeight: '700' },
  detailItem: { ...typography.bodySm, color: colors.text, flex: 1, lineHeight: 22 },

  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
});

// Category chip with animation
function CategoryChip({ category: catKey, Icon, active, onPress, label }: {
  category: Category;
  Icon: React.ComponentType<any>;
  active: boolean;
  onPress: () => void;
  label: string;
}) {
  const scale = useSharedValue(1);
  const catColor = CAT_COLOR[catKey] ?? colors.primary;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          s.catChip,
          active && { backgroundColor: catColor, borderColor: catColor },
        ]}
        onPress={() => { scale.value = withSpring(0.92); scale.value = withSpring(1); onPress(); }}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 200 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 180 }); }}
      >
        <Icon size={16} color={active ? colors.textInverse : catColor} weight={active ? 'fill' : 'regular'} />
        <Text style={[s.catLabel, active && { color: colors.textInverse }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RecipesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [cat, setCat]     = useState<Category>('all');

  const filtered = searchRecipes(query).filter(
    (r) => cat === 'all' || r.category === cat
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={[s.header, { paddingTop: insets.top + 16 }]}>
        <Text style={s.headerTitle}>{t('recipe.title')}</Text>
        <Text style={s.headerSub}>{t('recipe.subtitle')}</Text>
      </Animated.View>

      {/* Search bar */}
      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <View style={s.searchBar}>
          <MagnifyingGlass size={18} weight="regular" color={colors.textSecondary} />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t('recipe.search_placeholder')}
            placeholderTextColor={colors.textPlaceholder}
            clearButtonMode="while-editing"
          />
        </View>
      </Animated.View>

      {/* Category filter */}
      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catRow} contentContainerStyle={s.catContent}>
          {CATS.map(({ key, Icon }) => (
            <CategoryChip
              key={key}
              category={key}
              Icon={Icon}
              active={cat === key}
              onPress={() => setCat(key)}
              label={key === 'all' ? t('activity.all') : t(`food.meal_${key}`, { defaultValue: key })}
            />
          ))}
        </ScrollView>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInRight.delay(180).springify()}>
        <View style={s.statsRow}>
          <Text style={s.statsText}>
            {filtered.length} {t('recipe.count_label')}
          </Text>
        </View>
      </Animated.View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        renderItem={({ item, index }) => <RecipeCard recipe={item} index={index} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <MagnifyingGlass size={56} weight="thin" color={colors.border} />
            <Text style={s.emptyText}>{t('food.no_results')}</Text>
          </View>
        }
      />
      <BottomNav />
    </View>
  );
}
