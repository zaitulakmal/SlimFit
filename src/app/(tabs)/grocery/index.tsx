import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, FlatList, Linking, Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { ArrowsCounterClockwise, MapPin, Crosshair, NavigationArrow } from 'phosphor-react-native';

import { colors, spacing, typography, shadow, radius } from '../../../constants/theme';

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

// Use Overpass API (OpenStreetMap) — completely free, no API key
async function fetchNearbyGroceries(lat: number, lng: number): Promise<Place[]> {
  const radius = 3000; // 3 km
  const query = `
    [out:json][timeout:15];
    (
      node["shop"~"supermarket|convenience|greengrocer|wholesale|general"](around:${radius},${lat},${lng});
      node["name"~"Mydin|Giant|Tesco|AEON|Jaya Grocer|Village Grocer|Cold Storage|Hero|Econsave|Lotus|Speedmart|99 Speedmart|Fresh|Grocer|Mart|Runcit|Hypermarket",i](around:${radius},${lat},${lng});
    );
    out body;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'SlimTrack/1.0' } });
  if (!res.ok) throw new Error('Overpass request failed');
  const json = await res.json();

  const seen = new Set<string>();
  const places: Place[] = [];
  for (const el of (json.elements ?? []) as any[]) {
    const name: string = el.tags?.name ?? el.tags?.['name:en'] ?? '';
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    const dist = haversineKm(lat, lng, el.lat, el.lon);
    places.push({
      id: String(el.id),
      name,
      vicinity: el.tags?.['addr:full'] ?? el.tags?.['addr:street'] ?? '',
      lat: el.lat,
      lng: el.lon,
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
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setLocation(loc);

      const results = await fetchNearbyGroceries(loc.lat, loc.lng);
      setPlaces(results);
      if (results.length === 0) setError(t('grocery.none_found'));
    } catch (e) {
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

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>{t('grocery.title')}</Text>
        <TouchableOpacity onPress={load} style={s.refreshBtn} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <ArrowsCounterClockwise size={20} weight="regular" color={colors.primary} />
          }
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={s.mapContainer}>
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
                pinColor={selected?.id === place.id ? colors.coral : colors.primary}
                onPress={() => setSelected(place)}
              />
            ))}
          </MapView>
        ) : (
          <View style={s.mapPlaceholder}>
            {loading
              ? <ActivityIndicator size="large" color={colors.primary} />
              : <MapPin size={48} weight="regular" color={colors.border} />
            }
            {!!error && <Text style={s.errorText}>{error}</Text>}
          </View>
        )}

        {/* My location button */}
        {location && (
          <TouchableOpacity
            style={s.myLocBtn}
            onPress={() => {
              mapRef.current?.animateToRegion({
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
              }, 600);
            }}
          >
            <Crosshair size={22} weight="regular" color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Selected place info bar */}
      {selected && (
        <View style={s.selectedBar}>
          <View style={s.selectedInfo}>
            <Text style={s.selectedName} numberOfLines={1}>{selected.name}</Text>
            <Text style={s.selectedDist}>
              {selected.distance?.toFixed(1)} km {selected.vicinity ? `· ${selected.vicinity}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={s.directionsBtn}
            onPress={() => openDirections(selected.lat, selected.lng, selected.name)}
          >
            <NavigationArrow size={16} weight="fill" color={colors.white} />
            <Text style={s.directionsBtnText}>{t('grocery.directions')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter chips */}
      {places.length > 0 && (
        <View style={s.filterRow}>
          {CATEGORY_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.filterChip, filter === f && s.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f === 'all' ? t('activity.all') : f}
              </Text>
            </TouchableOpacity>
          ))}
          <Text style={s.countText}>{filtered.length} {t('grocery.places')}</Text>
        </View>
      )}

      {/* List */}
      {places.length > 0 && (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          style={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[s.placeRow, selected?.id === item.id && s.placeRowSelected]}
              onPress={() => focusPlace(item)}
              activeOpacity={0.75}
            >
              <View style={[s.placeIndex, selected?.id === item.id && { backgroundColor: colors.primary }]}>
                <Text style={[s.placeIndexText, selected?.id === item.id && { color: colors.white }]}>
                  {index + 1}
                </Text>
              </View>
              <View style={s.placeInfo}>
                <Text style={s.placeName} numberOfLines={1}>{item.name}</Text>
                {item.vicinity ? (
                  <Text style={s.placeAddr} numberOfLines={1}>{item.vicinity}</Text>
                ) : null}
              </View>
              <View style={s.placeRight}>
                <Text style={s.placeDist}>{item.distance?.toFixed(1)} km</Text>
                <TouchableOpacity
                  onPress={() => openDirections(item.lat, item.lng, item.name)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <NavigationArrow size={18} weight="regular" color={colors.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>{t('grocery.none_found')}</Text>
            </View>
          }
        />
      )}

      {/* Error state (no location yet) */}
      {!loading && !!error && places.length === 0 && (
        <View style={s.errorState}>
          <MapPin size={52} weight="regular" color={colors.border} />
          <Text style={s.errorStateText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}>
            <Text style={s.retryBtnText}>{t('grocery.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  headerTitle: { ...typography.heading, color: colors.textPrimary },
  refreshBtn: { padding: spacing.xs },

  mapContainer: { height: 280, backgroundColor: colors.background },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...typography.label, color: colors.coral, textAlign: 'center', paddingHorizontal: spacing.lg },

  myLocBtn: {
    position: 'absolute', bottom: spacing.sm, right: spacing.sm,
    backgroundColor: colors.white, borderRadius: radius.full,
    padding: spacing.sm, ...shadow.md,
  },

  selectedBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.selectedTint, borderTopWidth: 1, borderTopColor: colors.primary + '40',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm,
  },
  selectedInfo: { flex: 1 },
  selectedName: { ...typography.body, color: colors.textPrimary },
  selectedDist: { ...typography.label, color: colors.textSecondary },
  directionsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primary, borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  directionsBtnText: { ...typography.label, color: colors.white, fontWeight: '700' as any },

  filterRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.white,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.label, color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  countText: { ...typography.label, color: colors.textSecondary, marginLeft: 'auto' as any },

  list: { flex: 1 },
  placeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm,
  },
  placeRowSelected: { backgroundColor: colors.selectedTint },
  placeIndex: {
    width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  placeIndexText: { ...typography.label, color: colors.textPrimary, fontWeight: '700' as any },
  placeInfo: { flex: 1 },
  placeName: { ...typography.body, color: colors.textPrimary },
  placeAddr: { ...typography.label, color: colors.textSecondary, marginTop: 1 },
  placeRight: { alignItems: 'flex-end', gap: 4 },
  placeDist: { ...typography.label, color: colors.primary, fontWeight: '700' as any },

  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  errorStateText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: 12 },
  retryBtnText: { ...typography.body, color: colors.white },
});
