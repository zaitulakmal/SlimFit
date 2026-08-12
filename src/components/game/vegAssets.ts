/**
 * vegAssets — curated catalog of the "99 vegetables & herbs" PNG pack.
 *
 * We hand-picked a cute, readable subset (21 veg) and copied the PNGs into
 * assets/garden/veg/. Each entry carries a require()'d source so it bundles
 * through Metro the same way the app's other images do.
 */

export interface VegDef {
  key: string;
  label: string;
  src: number;
}

export const VEG: VegDef[] = [
  { key: 'tomato_red', label: 'Tomato', src: require('@/assets/garden/veg/tomato_red.png') },
  { key: 'carrot_orange', label: 'Carrot', src: require('@/assets/garden/veg/carrot_orange.png') },
  { key: 'broccoli', label: 'Broccoli', src: require('@/assets/garden/veg/broccoli.png') },
  { key: 'eggplant', label: 'Eggplant', src: require('@/assets/garden/veg/eggplant.png') },
  { key: 'pepper_bell_green', label: 'Pepper', src: require('@/assets/garden/veg/pepper_bell_green.png') },
  { key: 'cucumber', label: 'Cucumber', src: require('@/assets/garden/veg/cucumber.png') },
  { key: 'lettuce', label: 'Lettuce', src: require('@/assets/garden/veg/lettuce.png') },
  { key: 'cabbage', label: 'Cabbage', src: require('@/assets/garden/veg/cabbage.png') },
  { key: 'potato_yellow', label: 'Potato', src: require('@/assets/garden/veg/potato_yellow.png') },
  { key: 'radish', label: 'Radish', src: require('@/assets/garden/veg/radish.png') },
  { key: 'zucchini_green', label: 'Zucchini', src: require('@/assets/garden/veg/zucchini_green.png') },
  { key: 'spinach', label: 'Spinach', src: require('@/assets/garden/veg/spinach.png') },
  { key: 'basil', label: 'Basil', src: require('@/assets/garden/veg/basil.png') },
  { key: 'pepper_chili_red', label: 'Chili', src: require('@/assets/garden/veg/pepper_chili_red.png') },
  { key: 'squash_orange', label: 'Squash', src: require('@/assets/garden/veg/squash_orange.png') },
  { key: 'onion', label: 'Onion', src: require('@/assets/garden/veg/onion.png') },
  { key: 'ginger', label: 'Ginger', src: require('@/assets/garden/veg/ginger.png') },
  { key: 'cauliflower', label: 'Cauliflower', src: require('@/assets/garden/veg/cauliflower.png') },
  { key: 'mint', label: 'Mint', src: require('@/assets/garden/veg/mint.png') },
  { key: 'chives', label: 'Chives', src: require('@/assets/garden/veg/chives.png') },
  { key: 'garlic', label: 'Garlic', src: require('@/assets/garden/veg/garlic.png') },
];

const BY_KEY: Record<string, VegDef> = Object.fromEntries(VEG.map((v) => [v.key, v]));

export function getVeg(key: string | null): VegDef | null {
  return key ? BY_KEY[key] ?? null : null;
}

/** Cat sprite strips from the CatPackFree pack (32px-tall horizontal strips). */
export interface CatDef {
  key: string;
  name: string;
  src: number;
  frames: number;
  frameW: number;
  frameH: number;
}

export const CATS: CatDef[] = [
  {
    key: 'catIdle',
    name: 'Mochi',
    src: require('@/assets/garden/cats/Idle.png'),
    frames: 10,
    frameW: 32,
    frameH: 32,
  },
  {
    key: 'catDracula',
    name: 'Draco',
    src: require('@/assets/garden/cats/drculacat.png'),
    frames: 6,
    frameW: 32,
    frameH: 32,
  },
];

const CAT_BY_KEY: Record<string, CatDef> = Object.fromEntries(CATS.map((c) => [c.key, c]));
export function getCat(key: string): CatDef | null {
  return CAT_BY_KEY[key] ?? null;
}
