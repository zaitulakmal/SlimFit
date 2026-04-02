import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MagnifyingGlass, Sun, CloudSun, Moon, Coffee, Drop, Clock, CaretUp, CaretDown } from 'phosphor-react-native';

import { colors, spacing, typography } from '../../../constants/theme';
import { RECIPES, searchRecipes, type Recipe } from '../../../data/recipes';

const CATS = ['all', 'breakfast', 'lunch', 'dinner', 'snack', 'drink'] as const;
type CatIconMap = Record<string, React.ComponentType<{ size: number; color: string; weight?: string }>>;
const CAT_ICONS: CatIconMap = {
  breakfast: Sun as any,
  lunch:     CloudSun as any,
  dinner:    Moon as any,
  snack:     Coffee as any,
  drink:     Drop as any,
};
import React from 'react';

const DIFF_COLOR = { easy: colors.primary, medium: colors.amber };

export default function RecipesScreen() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const results = searchRecipes(query).filter(
    (r) => filterCat === 'all' || r.category === filterCat
  );

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={24} weight="regular" color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('recipe.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll}>
        {CATS.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.catChip, filterCat === cat && s.catChipActive]}
            onPress={() => setFilterCat(cat)}
          >
            {cat !== 'all' && (() => { const CatIcon = CAT_ICONS[cat]; return CatIcon ? <CatIcon size={13} color={filterCat === cat ? colors.white : colors.textSecondary} weight="regular" /> : null; })()}
            <Text style={[s.catChipText, filterCat === cat && s.catChipTextActive]}>
              {cat === 'all' ? t('activity.all') : t(`food.meal_${cat}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {results.map((r) => {
          const isOpen = expanded === r.id;
          return (
            <TouchableOpacity
              key={r.id}
              style={s.recipeCard}
              onPress={() => setExpanded(isOpen ? null : r.id)}
              activeOpacity={0.8}
            >
              {/* Top row */}
              <View style={s.recipeTop}>
                <View style={s.recipeInfo}>
                  <Text style={s.recipeName}>{r.name}</Text>
                  <Text style={s.recipeNameMy}>{r.nameMy}</Text>
                  <View style={s.recipeMeta}>
                    <View style={[s.diffBadge, { backgroundColor: DIFF_COLOR[r.difficulty] + '20' }]}>
                      <Text style={[s.diffText, { color: DIFF_COLOR[r.difficulty] }]}>
                        {r.difficulty}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Clock size={11} weight="regular" color={colors.textSecondary} />
                      <Text style={s.metaText}>{r.prepMin + r.cookMin} min</Text>
                    </View>
                    <Text style={s.metaText}>{r.servings} serving{r.servings > 1 ? 's' : ''}</Text>
                  </View>
                </View>
                <View style={s.calsBadge}>
                  <Text style={s.calsValue}>{r.calories}</Text>
                  <Text style={s.calsLabel}>kcal</Text>
                </View>
              </View>

              {/* Macros */}
              <View style={s.macroRow}>
                <Text style={s.macroPill}>P {r.proteinG}g</Text>
                <Text style={s.macroPill}>C {r.carbsG}g</Text>
                <Text style={s.macroPill}>F {r.fatG}g</Text>
                {r.tags.slice(0, 2).map((tag) => (
                  <Text key={tag} style={s.tagPill}>{tag}</Text>
                ))}
              </View>

              {/* Expanded detail */}
              {isOpen && (
                <View style={s.detail}>
                  <Text style={s.detailSection}>{t('recipe.ingredients')}</Text>
                  {r.ingredients.map((ing, i) => (
                    <Text key={i} style={s.detailItem}>• {ing}</Text>
                  ))}
                  <Text style={[s.detailSection, { marginTop: spacing.sm }]}>{t('recipe.steps')}</Text>
                  {r.steps.map((step, i) => (
                    <Text key={i} style={s.detailItem}>{i + 1}. {step}</Text>
                  ))}
                </View>
              )}

              {isOpen
                ? <CaretUp size={16} weight="bold" color={colors.textSecondary} style={{ alignSelf: 'center', marginTop: spacing.xs }} />
                : <CaretDown size={16} weight="bold" color={colors.textSecondary} style={{ alignSelf: 'center', marginTop: spacing.xs }} />
              }
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { ...typography.heading, color: colors.textPrimary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    margin: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.background, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, padding: 0 },
  catScroll: { paddingLeft: spacing.md, marginBottom: spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    marginRight: spacing.sm, backgroundColor: colors.white,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { ...typography.label, color: colors.textSecondary },
  catChipTextActive: { color: colors.white },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  recipeCard: {
    backgroundColor: colors.background, borderRadius: 14,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  recipeTop: { flexDirection: 'row', gap: spacing.sm },
  recipeInfo: { flex: 1 },
  recipeName: { ...typography.body, color: colors.textPrimary },
  recipeNameMy: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  recipeMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  diffBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  diffText: { ...typography.label, fontWeight: '700' },
  metaText: { ...typography.label, color: colors.textSecondary },
  calsBadge: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 10, padding: spacing.sm, minWidth: 56 },
  calsValue: { ...typography.heading, color: colors.primary },
  calsLabel: { ...typography.label, color: colors.textSecondary },
  macroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  macroPill: { ...typography.label, color: colors.textSecondary, backgroundColor: colors.white, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  tagPill: { ...typography.label, color: colors.skyBlue, backgroundColor: '#E3F2FD', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 6 },
  detail: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  detailSection: { ...typography.body, color: colors.primary, marginBottom: spacing.xs },
  detailItem: { ...typography.label, color: colors.textPrimary, marginBottom: 4, lineHeight: 18 },
});
