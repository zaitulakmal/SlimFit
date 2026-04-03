/**
 * Grocery screen — Duolingo-style redesign.
 * Keeps all existing data/API logic, only UI layer changed.
 */

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, FlatList, Linking, Platform, StatusBar,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import {
  ArrowsCounterClockwise, MapPin, Crosshair, NavigationArrow, Storefront, MapTrifold,
} from 'phosphor-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, spacing, typography, shadow, radius } from '../../constants/theme-new';
import { pastelColors } from '../../constants/pastel-theme';
import BottomNav from '../../components/BottomNav';

interface Place {
  id: string;
  name: string;
  vicinity: string;
  lat: number;
  lng: number;
  distance?: number;
}

const GROCERY_KEYWORDS = [
  'supermarket', 'grocery', 'hypermarket',
  'fresh mart', 'mydin', 'giant', 'tesco', 'aeon', 'jaya grocer',
  'village grocer', 'cold storage', 'hero', 'econsave', 'lotus',
  'speedmart', 'big pharmacy', 'kedai runcit',
];

const CATEGORY_FILTERS = ['all', 'supermarket', 'hypermarket', 'kedai runcit'];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchNearbyGroceries(lat: number, lng: number): Promise<Place[]> {
  const searchRadius = 5000;
  // Query node + way + relation so polygon-mapped shops are included
  const query = `
    [out:json][timeout:30];
    (
      node["shop"~"supermarket|convenience|greengrocer|wholesale|general|department_store|mall|food"](around:${searchRadius},${lat},${lng});
      way["shop"~"supermarket|convenience|greengrocer|wholesale|general|department_store|mall|food"](around:${searchRadius},${lat},${lng});
      node["amenity"="marketplace"](around:${searchRadius},${lat},${lng});
      way["amenity"="marketplace"](around:${searchRadius},${lat},${lng});
    );
    out center;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'SlimTrack/1.0' } });
  if (!res.ok) throw new Error('Overpass request failed');
  const json = await res.json();

  const seen = new Set<string>();
  const places: Place[] = [];

  for (const el of (json.elements ?? []) as any[]) {
    const name: string =
      el.tags?.name ??
      el.tags?.['name:en'] ??
      el.tags?.['name:ms'] ??
      '';
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    // ways use center lat/lon, nodes use lat/lon directly
    const elLat: number = el.lat ?? el.center?.lat;
    const elLon: number = el.lon ?? el.center?.lon;
    if (!elLat || !elLon) continue;

    const dist = haversineKm(lat, lng, elLat, elLon);
    places.push({
      id: String(el.id),
      name,
      vicinity: el.tags?.['addr:full'] ?? el.tags?.['addr:street'] ?? el.tags?.['addr:city'] ?? '',
      lat: elLat,
      lng: elLon,
      distance: dist,
    });
  }
  return places.sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99)).slice(0, 30);
}

function openDirections(lat: number, lng: number, name: string) {
  const label = encodeURIComponent(name);
  if (Platform.OS === 'ios') {
    Linking.openURL(`maps://?daddr=${lat},${lng}&q=${label}`);
  } else {
    Linking.openURL(`google.navigation:q=${lat},${lng}`);
  }
}

function FilterChip({ label, active, onPress, index }: { label: string; active: boolean; onPress: () => void; index: number }) {
  const scale = useSharedValue(1);

  return (
    <Animated.View entering={FadeInRight.delay(index * 40)} style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[filterStyles.chip, active && filterStyles.chipActive]}
        onPress={() => { scale.value = withSpring(0.95); scale.value = withSpring(1); onPress(); }}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 200 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 180 }); }}
      >
        <Text style={[filterStyles.chipText, active && filterStyles.chipTextActive]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const filterStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.label, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
});

function PlaceRow({ place, index, selected, onPress, onNavigate }: {
  place: Place; index: number; selected: boolean;
  onPress: () => void; onNavigate: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInRight.delay(index * 50)} style={animatedStyle}>
      <TouchableOpacity
        style={[rowStyles.row, selected && rowStyles.rowSelected]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        activeOpacity={1}
      >
        <View style={[rowStyles.index, selected && { backgroundColor: colors.primary }]}>
          <Text style={[rowStyles.indexText, selected && { color: colors.textInverse }]}>{index + 1}</Text>
        </View>
        <View style={rowStyles.info}>
          <Text style={rowStyles.name} numberOfLines={1}>{place.name}</Text>
          {place.vicinity ? <Text style={rowStyles.addr} numberOfLines={1}>{place.vicinity}</Text> : null}
        </View>
        <View style={rowStyles.right}>
          <Text style={rowStyles.dist}>{place.distance?.toFixed(1)} km</Text>
          <TouchableOpacity onPress={onNavigate} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <NavigationArrow size={20} weight="fill" color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  rowSelected: { backgroundColor: colors.primarySubtle },
  index: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  indexText: { ...typography.label, fontWeight: '700', color: colors.text },
  info: { flex: 1 },
  name: { ...typography.body, color: colors.text, fontWeight: '600' },
  addr: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  dist: { ...typography.bodySm, color: colors.primary, fontWeight: '700' },
});

export default function GroceryScreen() {
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Place | null>(null);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(t('grocery.permission_denied'));
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(loc);

      const results = await fetchNearbyGroceries(loc.lat, loc.lng);
      setPlaces(results);
      if (results.length === 0) setError(t('grocery.none_found'));
    } catch {
      setError(t('grocery.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const focusPlace = (place: Place) => {
    setSelected(place);
    mapRef.current?.animateToRegion({
      latitude: place.lat,
      longitude: place.lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 600);
  };

  const filtered = filter === 'all'
    ? places
    : places.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));

  const refreshScale = useSharedValue(1);
  const refreshStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${refreshScale.value * 360}deg` }, { scale: refreshScale.value }] }));

  const handleRefresh = () => {
    refreshScale.value = withSpring(1, { damping: 0 }, () => {
      refreshScale.value = withSpring(1, { damping: 0 });
    });
    load();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <View style={styles.headerLeft}>
          <Storefront size={28} weight="fill" color={colors.primary} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('grocery.title')}</Text>
            <Text style={styles.headerSub}>
              {loading ? 'Searching nearby...' : location ? `${filtered.length} stores nearby` : 'Finding your location...'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Animated.View style={refreshStyle}>
                <ArrowsCounterClockwise size={22} weight="bold" color={colors.primary} />
              </Animated.View>
          }
        </TouchableOpacity>
      </Animated.View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: location.lat,
              longitude: location.lng,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {places.map((place) => (
              <Marker
                key={place.id}
                coordinate={{ latitude: place.lat, longitude: place.lng }}
                title={place.name}
                description={place.distance ? `${place.distance.toFixed(1)} km` : ''}
                pinColor={selected?.id === place.id ? colors.danger : colors.primary}
                onPress={() => setSelected(place)}
              />
            ))}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            {loading
              ? <ActivityIndicator size="large" color={colors.primary} />
              : <MapTrifold size={56} weight="thin" color={colors.border} />
            }
            {!!error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        )}

        {/* My location button */}
        {location && (
          <TouchableOpacity
            style={styles.myLocBtn}
            onPress={() => {
              mapRef.current?.animateToRegion({
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
              }, 600);
            }}
          >
            <Crosshair size={22} weight="bold" color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Selected place info bar */}
      {selected && (
        <Animated.View entering={FadeInUp.springify()} style={styles.selectedBar}>
          <View style={[styles.selectedDot, { backgroundColor: colors.danger }]} />
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName} numberOfLines={1}>{selected.name}</Text>
            <Text style={styles.selectedDist}>
              {selected.distance?.toFixed(1)} km {selected.vicinity ? `· ${selected.vicinity}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={() => openDirections(selected.lat, selected.lng, selected.name)}
          >
            <NavigationArrow size={16} weight="fill" color={colors.textInverse} />
            <Text style={styles.directionsBtnText}>{t('grocery.directions')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Filter chips */}
      {places.length > 0 && (
        <View style={styles.filterRow}>
          {CATEGORY_FILTERS.map((f, i) => (
            <FilterChip
              key={f}
              label={f === 'all' ? t('activity.all') : f}
              active={filter === f}
              onPress={() => setFilter(f)}
              index={i}
            />
          ))}
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length}</Text>
          </View>
        </View>
      )}

      {/* List */}
      {places.length > 0 && (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <PlaceRow
              place={item}
              index={index}
              selected={selected?.id === item.id}
              onPress={() => focusPlace(item)}
              onNavigate={() => openDirections(item.lat, item.lng, item.name)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MapPin size={52} weight="thin" color={colors.border} />
              <Text style={styles.emptyText}>{t('grocery.none_found')}</Text>
            </View>
          }
        />
      )}

      {/* Error state */}
      {!loading && !!error && places.length === 0 && (
        <Animated.View entering={FadeInUp.springify()} style={styles.errorState}>
          <MapPin size={64} weight="thin" color={colors.textTertiary} />
          <Text style={styles.errorStateText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <ArrowsCounterClockwise size={18} weight="bold" color={colors.textInverse} />
            <Text style={styles.retryBtnText}>{t('grocery.retry')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerText: {},
  headerTitle: { ...typography.heading, color: colors.text },
  headerSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  refreshBtn: { padding: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.borderLight },

  mapContainer: { height: 260, backgroundColor: colors.borderLight },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...typography.body, color: colors.danger, textAlign: 'center', paddingHorizontal: spacing.xl },

  myLocBtn: {
    position: 'absolute', bottom: spacing.md, right: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.full,
    padding: spacing.sm, ...shadow.lg,
  },

  selectedBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
    ...shadow.sm,
  },
  selectedDot: { width: 10, height: 10, borderRadius: 5 },
  selectedInfo: { flex: 1 },
  selectedName: { ...typography.body, color: colors.text, fontWeight: '600' },
  selectedDist: { ...typography.caption, color: colors.textSecondary },
  directionsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    ...shadow.sm,
  },
  directionsBtnText: { ...typography.label, color: colors.textInverse, fontWeight: '700' },

  filterRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  countBadge: {
    marginLeft: 'auto',
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  countText: { ...typography.label, color: colors.primary, fontWeight: '700' },

  list: { flex: 1, backgroundColor: colors.background },

  empty: { padding: spacing.xxxl, alignItems: 'center', gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

  errorState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.background,
  },
  errorStateText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: radius.xl, ...shadow.md,
  },
  retryBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' },
});
