export interface WorkoutType {
  id: string;
  name: string;
  nameMy: string;
  met: number; // Metabolic Equivalent of Task
  icon: string;
  category: 'cardio' | 'strength' | 'flexibility' | 'sport';
}

export const WORKOUT_TYPES: WorkoutType[] = [
  // Cardio
  { id: 'brisk_walk',   name: 'Brisk Walk',       nameMy: 'Jalan Pantas',      met: 3.5,  icon: 'walk',           category: 'cardio' },
  { id: 'jogging',      name: 'Jogging',           nameMy: 'Berjoging',         met: 7.0,  icon: 'person-outline', category: 'cardio' },
  { id: 'running',      name: 'Running',           nameMy: 'Berlari',           met: 9.8,  icon: 'timer-outline',  category: 'cardio' },
  { id: 'cycling',      name: 'Cycling',           nameMy: 'Berbasikal',        met: 5.8,  icon: 'bicycle',        category: 'cardio' },
  { id: 'swimming',     name: 'Swimming',          nameMy: 'Berenang',          met: 6.0,  icon: 'water',          category: 'cardio' },
  { id: 'jump_rope',    name: 'Jump Rope',         nameMy: 'Tali Lompat',       met: 10.0, icon: 'repeat',         category: 'cardio' },
  { id: 'zumba',        name: 'Zumba / Dance',     nameMy: 'Zumba / Tarian',    met: 6.5,  icon: 'musical-notes',  category: 'cardio' },
  { id: 'hiit',         name: 'HIIT',              nameMy: 'HIIT',              met: 8.0,  icon: 'flash',          category: 'cardio' },
  // Strength
  { id: 'weight_train', name: 'Weight Training',   nameMy: 'Angkat Berat',      met: 3.5,  icon: 'barbell',        category: 'strength' },
  { id: 'bodyweight',   name: 'Bodyweight (Push-ups/Sit-ups)', nameMy: 'Senaman Berat Badan', met: 3.8, icon: 'body', category: 'strength' },
  { id: 'circuit',      name: 'Circuit Training',  nameMy: 'Latihan Litar',     met: 6.0,  icon: 'fitness',        category: 'strength' },
  // Flexibility
  { id: 'yoga',         name: 'Yoga',              nameMy: 'Yoga',              met: 2.5,  icon: 'leaf',           category: 'flexibility' },
  { id: 'stretching',   name: 'Stretching',        nameMy: 'Regangan',          met: 2.3,  icon: 'accessibility',  category: 'flexibility' },
  // Sports
  { id: 'badminton',    name: 'Badminton',         nameMy: 'Badminton',         met: 5.5,  icon: 'tennisball',     category: 'sport' },
  { id: 'futsal',       name: 'Futsal / Football', nameMy: 'Futsal / Bola',     met: 7.0,  icon: 'football',       category: 'sport' },
  { id: 'basketball',   name: 'Basketball',        nameMy: 'Bola Keranjang',    met: 6.5,  icon: 'basketball',     category: 'sport' },
  { id: 'table_tennis', name: 'Table Tennis',      nameMy: 'Ping Pong',         met: 4.0,  icon: 'disc',           category: 'sport' },
];

/**
 * Calculate calories burned using MET formula.
 * Calories = MET × weight_kg × (duration_min / 60)
 */
export function calcCaloriesBurned(met: number, weightKg: number, durationMin: number): number {
  return Math.round(met * weightKg * (durationMin / 60));
}

export function getWorkoutById(id: string): WorkoutType | undefined {
  return WORKOUT_TYPES.find((w) => w.id === id);
}
