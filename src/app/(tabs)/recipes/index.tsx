import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Clock, Users, CaretUp, CaretDown, Lightbulb, MagnifyingGlass, GridFour, Sun, CloudSun, Moon, Coffee, Drop } from 'phosphor-react-native';
import React from 'react';

import { colors, spacing, typography, shadow, radius } from '../../../constants/theme';
import { RECIPES, searchRecipes, type Recipe } from '../../../data/recipes';

type Category = 'all' | Recipe['category'];

type IconComponent = React.ComponentType<{ size: number; color: string; weight?: string }>;
const CATS: { key: Category; Icon: IconComponent }[] = [
  { key: 'all',       Icon: GridFour as IconComponent },
  { key: 'breakfast', Icon: Sun as IconComponent },
  { key: 'lunch',     Icon: CloudSun as IconComponent },
  { key: 'dinner',    Icon: Moon as IconComponent },
  { key: 'snack',     Icon: Coffee as IconComponent },
  { key: 'drink',     Icon: Drop as IconComponent },
];

const DIFF_COLOR: Record<string, string> = {
  easy:   colors.primary,
  medium: colors.amber,
};

const CAT_BG: Record<string, string> = {
  breakfast: '#FFF8E1',
  lunch:     '#E8F5E9',
  dinner:    '#EDE7F6',
  snack:     '#FFF3E0',
  drink:     '#E3F2FD',
  all:       colors.background,
};

const CAT_COLOR: Record<string, string> = {
  breakfast: colors.amber,
  lunch:     colors.vividGreen,
  dinner:    '#7B63D0',
  snack:     '#F4962A',
  drink:     colors.skyBlue,
  all:       colors.primary,
};

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[pill.wrap, { backgroundColor: color + '18' }]}>
      <Text style={[pill.val, { color }]}>{value}</Text>
      <Text style={pill.lbl}>{label}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  val:  { ...typography.body, fontWeight: '700' as any },
  lbl:  { ...typography.label, color: colors.textSecondary },
});

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const totalMin = recipe.prepMin + recipe.cookMin;
  const catColor = CAT_COLOR[recipe.category] ?? colors.primary;
  const catBg    = CAT_BG[recipe.category] ?? colors.background;

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => setOpen((v) => !v)}
      activeOpacity={0.88}
    >
      {/* Category banner */}
      <View style={[s.cardBanner, { backgroundColor: catBg }]}>
        <Text style={[s.cardCat, { color: catColor }]}>
          {t(`food.meal_${recipe.category}`, { defaultValue: recipe.category })}
        </Text>
        <View style={[s.diffBadge, { backgroundColor: DIFF_COLOR[recipe.difficulty] + '22' }]}>
          <Text style={[s.diffText, { color: DIFF_COLOR[recipe.difficulty] }]}>
            {recipe.difficulty}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={s.cardBody}>
        <Text style={s.cardName}>{recipe.name}</Text>
        <Text style={s.cardNameMy}>{recipe.nameMy}</Text>

        {/* Meta row */}
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Clock size={13} weight="regular" color={colors.textSecondary} />
            <Text style={s.metaText}>{totalMin} min</Text>
          </View>
          <View style={s.metaItem}>
            <Users size={13} weight="regular" color={colors.textSecondary} />
            <Text style={s.metaText}>{recipe.servings} serving{recipe.servings > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Macro pills */}
        <View style={s.macroRow}>
          <MacroPill label="kcal"    value={String(recipe.calories)} color={colors.coral} />
          <MacroPill label="Protein" value={`${recipe.proteinG}g`}  color={colors.primary} />
          <MacroPill label="Carbs"   value={`${recipe.carbsG}g`}    color={colors.amber} />
          <MacroPill label="Fat"     value={`${recipe.fatG}g`}      color={colors.textSecondary} />
        </View>

        {/* Tags */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tagScroll}>
          {recipe.tags.map((tag) => (
            <View key={tag} style={s.tagChip}>
              <Text style={s.tagText}>{tag}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Expand arrow */}
        <View style={s.expandRow}>
          <Text style={s.expandHint}>{open ? t('recipe.hide_detail') : t('recipe.see_detail')}</Text>
          {open ? <CaretUp size={16} weight="bold" color={colors.primary} /> : <CaretDown size={16} weight="bold" color={colors.primary} />}
        </View>

        {/* Expanded detail */}
        {open && (
          <View style={s.detail}>
            {/* Healthy tip */}
            {recipe.tip ? (
              <View style={s.tipBox}>
                <Lightbulb size={16} weight="regular" color={colors.vividGreen} />
                <Text style={s.tipText}>{recipe.tip}</Text>
              </View>
            ) : null}

            <Text style={s.detailSection}>{t('recipe.ingredients')}</Text>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={s.listRow}>
                <View style={s.bullet} />
                <Text style={s.detailItem}>{ing}</Text>
              </View>
            ))}

            <Text style={[s.detailSection, { marginTop: spacing.md }]}>{t('recipe.steps')}</Text>
            {recipe.steps.map((step, i) => (
              <View key={i} style={s.stepRow}>
                <View style={[s.stepNum, { backgroundColor: catBg }]}>
                  <Text style={[s.stepNumText, { color: catColor }]}>{i + 1}</Text>
                </View>
                <Text style={s.detailItem}>{step}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function RecipesScreen() {
  const { t } = useTranslation();
  const [query, setQuery]       = useState('');
  const [cat, setCat]           = useState<Category>('all');

  const filtered = searchRecipes(query).filter(
    (r) => cat === 'all' || r.category === cat
  );

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>{t('recipe.title')}</Text>
        <Text style={s.headerSub}>{t('recipe.subtitle')}</Text>
      </View>

      {/* Search bar */}
      <View style={s.searchBar}>
        <MagnifyingGlass size={18} weight="regular" color={colors.textSecondary} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t('recipe.search_placeholder')}
          placeholderTextColor={colors.textSecondary}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catRow} contentContainerStyle={s.catContent}>
        {CATS.map(({ key, Icon }) => {
          const active = cat === key;
          const color  = active ? colors.white : CAT_COLOR[key] ?? colors.textSecondary;
          return (
            <TouchableOpacity
              key={key}
              style={[s.catChip, active && { backgroundColor: CAT_COLOR[key] ?? colors.primary, borderColor: 'transparent' }]}
              onPress={() => setCat(key)}
            >
              <Icon size={14} color={color} weight={active ? 'fill' : 'regular'} />
              <Text style={[s.catLabel, active && { color: colors.white }]}>
                {key === 'all' ? t('activity.all') : t(`food.meal_${key}`, { defaultValue: key })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Stats row */}
      <View style={s.statsRow}>
        <Text style={s.statsText}>
          {filtered.length} {t('recipe.count_label')}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <RecipeCard recipe={item} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <MagnifyingGlass size={48} weight="regular" color={colors.border} />
            <Text style={s.emptyText}>{t('food.no_results')}</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },

  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: { ...typography.heading, color: colors.textPrimary },
  headerSub:   { ...typography.label,   color: colors.textSecondary, marginTop: 2 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.background, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, padding: 0 },

  catRow:    { maxHeight: 44 },
  catContent:{ paddingHorizontal: spacing.md, gap: spacing.sm, paddingRight: spacing.md },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.white,
  },
  catLabel: { ...typography.label, color: colors.textSecondary },

  statsRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statsText: { ...typography.label, color: colors.textSecondary },

  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },

  card: {
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.borderLight,
    overflow: 'hidden',
    ...shadow.sm,
  },
  cardBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  cardCat:  { ...typography.label, fontWeight: '700' as any, textTransform: 'uppercase' },
  diffBadge:{ paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  diffText: { ...typography.label, fontWeight: '700' as any },

  cardBody: { padding: spacing.md },
  cardName:   { ...typography.body, color: colors.textPrimary },
  cardNameMy: { ...typography.label, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },

  metaRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  metaItem:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:{ ...typography.label, color: colors.textSecondary },

  macroRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },

  tagScroll:  { marginBottom: spacing.sm },
  tagChip: {
    backgroundColor: '#E3F2FD', paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: 6, marginRight: spacing.xs,
  },
  tagText: { ...typography.label, color: colors.skyBlue },

  expandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: spacing.xs },
  expandHint:{ ...typography.label, color: colors.primary },

  detail: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: 4 },

  tipBox: {
    flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start',
    backgroundColor: '#F1F8E9', borderRadius: 8, padding: spacing.sm,
    marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.vividGreen,
  },
  tipText: { ...typography.label, color: colors.textPrimary, flex: 1, lineHeight: 18 },

  detailSection: { ...typography.body, color: colors.primary, marginTop: spacing.xs, marginBottom: spacing.sm },

  listRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: 6 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6 },

  stepRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: 8 },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { ...typography.label, fontWeight: '700' as any },

  detailItem: { ...typography.label, color: colors.textPrimary, flex: 1, lineHeight: 19 },

  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
