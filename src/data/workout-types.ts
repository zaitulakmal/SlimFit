export interface WorkoutType {
  id: string;
  name: string;
  nameMy: string;
  met: number; // Metabolic Equivalent of Task
  icon: string;
  category: 'cardio' | 'strength' | 'flexibility' | 'sport';
  instructions: string[];
  tips: string[];
}

export const WORKOUT_TYPES: WorkoutType[] = [
  // Cardio
  { 
    id: 'brisk_walk',   
    name: 'Brisk Walk',       
    nameMy: 'Jalan Pantas',      
    met: 3.5,  
    icon: 'walk',           
    category: 'cardio',
    instructions: [
      'Warm up with 5 minutes of slow walking',
      'Walk at a pace where you can talk but not sing',
      'Keep your arms swinging naturally',
      'Maintain good posture - head up, shoulders relaxed',
      'Cool down with 5 minutes of slow walking'
    ],
    tips: ['Use comfortable walking shoes', 'Walk after meals for better digestion']
  },
  { 
    id: 'jogging',      
    name: 'Jogging',           
    nameMy: 'Berjoging',         
    met: 7.0,  
    icon: 'timer-outline',  
    category: 'cardio',
    instructions: [
      'Start with 5-minute warm-up walk',
      'Begin jogging at a comfortable pace',
      'Land midfoot, not on your heels',
      'Keep your core engaged and shoulders relaxed',
      'End with 5-minute cool-down walk'
    ],
    tips: ['Start slow if you are beginner', 'Run on soft surfaces when possible']
  },
  { 
    id: 'running',      
    name: 'Running',           
    nameMy: 'Berlari',           
    met: 9.8,  
    icon: 'timer-outline',  
    category: 'cardio',
    instructions: [
      'Warm up with dynamic stretches for 5 minutes',
      'Start with a light jog, then increase speed',
      'Breathe deeply - inhale for 3 steps, exhale for 2',
      'Keep your posture upright, lean slightly forward',
      'Cool down with slow jogging and static stretching'
    ],
    tips: ['Invest in good running shoes', 'Stay hydrated before and after']
  },
  { 
    id: 'cycling',      
    name: 'Cycling',           
    nameMy: 'Berbasikel',        
    met: 5.8,  
    icon: 'bicycle',        
    category: 'cardio',
    instructions: [
      'Adjust seat height - leg should be slightly bent at bottom',
      'Start with easy pedaling to warm up',
      'Keep a steady cadence (60-90 RPM)',
      'Hold handlebars loosely, relax shoulders',
      'Slow down for last 5 minutes as cool down'
    ],
    tips: ['Always wear a helmet', 'Check tire pressure before riding']
  },
  { 
    id: 'swimming',     
    name: 'Swimming',          
    nameMy: 'Berenang',          
    met: 6.0,  
    icon: 'water',          
    category: 'cardio',
    instructions: [
      'Start with 1-2 laps easy swimming as warm up',
      'Use proper breathing technique - exhale underwater',
      'Keep your body horizontal in the water',
      'Kick from hips, not knees',
      'End with slower laps to cool down'
    ],
    tips: ['Swim in lanes matching your level', 'Take breaks when needed']
  },
  { 
    id: 'jump_rope',    
    name: 'Jump Rope',         
    nameMy: 'Tali Lompat',       
    met: 10.0, 
    icon: 'repeat',         
    category: 'cardio',
    instructions: [
      'Stand with feet together, rope behind your heels',
      'Jump with both feet together, only 1-2 inches off ground',
      'Keep jumps short and quick',
      'Swing rope from your wrists, not arms',
      'Start with 30-second intervals, rest and repeat'
    ],
    tips: ['Use a rope that reaches your armpits when standing', 'Jump on soft surfaces']
  },
  { 
    id: 'zumba',        
    name: 'Zumba / Dance',     
    nameMy: 'Zumba / Tarian',    
    met: 6.5,  
    icon: 'musical-notes',  
    category: 'cardio',
    instructions: [
      'Warm up with easy dance moves for 5 minutes',
      'Follow the instructor\'s movements',
      'Keep moving even if you make mistakes',
      'Stay hydrated - sip water between songs',
      'Cool down with slow dance moves and stretching'
    ],
    tips: ['Wear comfortable shoes', 'Dance to your favorite music']
  },
  { 
    id: 'hiit',         
    name: 'HIIT',              
    nameMy: 'HIIT',              
    met: 8.0,  
    icon: 'flash',          
    category: 'cardio',
    instructions: [
      'Start with 5-minute general warm up',
      'Perform exercise at maximum effort for 20-30 seconds',
      'Rest for 10-15 seconds',
      'Repeat for 8-10 rounds',
      'End with 5-minute cool down and stretching'
    ],
    tips: ['Keep form over speed', 'Modify exercises if needed']
  },
  // Strength
  { 
    id: 'weight_train', 
    name: 'Weight Training',   
    nameMy: 'Angkat Berat',      
    met: 3.5,  
    icon: 'barbell',        
    category: 'strength',
    instructions: [
      'Start with light warm-up sets',
      'Choose weight you can lift 10-12 times comfortably',
      'Lower the weight slowly, don\'t drop it',
      'Keep core tight, back straight during lifts',
      'Rest 1-2 minutes between sets'
    ],
    tips: ['Start with lighter weights to learn proper form', 'Ask for guidance if new to weights']
  },
  { 
    id: 'bodyweight',   
    name: 'Bodyweight (Push-ups/Sit-ups)', 
    nameMy: 'Senaman Berat Badan', 
    met: 3.8, 
    icon: 'body', 
    category: 'strength',
    instructions: [
      'Push-ups: Hands shoulder-width apart, lower chest to ground',
      'Keep body straight from head to heels',
      'Sit-ups: Lie on back, knees bent, curl up to sit position',
      'Engage core, not neck, when doing sit-ups',
      'Start with 5-10 reps, increase gradually'
    ],
    tips: ['Modify on knees if standard push-ups are hard', 'Focus on form, not number of reps']
  },
  { 
    id: 'circuit',      
    name: 'Circuit Training',  
    nameMy: 'Latihan Litar',     
    met: 6.0,  
    icon: 'fitness',        
    category: 'strength',
    instructions: [
      'Set up 4-6 exercises in a circuit',
      'Perform each exercise for 30-60 seconds',
      'Move to next exercise with minimal rest',
      'Rest 1-2 minutes after completing circuit',
      'Repeat circuit 2-3 times'
    ],
    tips: ['Include both upper and lower body exercises', 'Keep rest periods short']
  },
  // Flexibility
  { 
    id: 'yoga',         
    name: 'Yoga',              
    nameMy: 'Yoga',              
    met: 2.5,  
    icon: 'leaf',           
    category: 'flexibility',
    instructions: [
      'Start in comfortable seated position',
      'Follow breathing exercises (pranayama)',
      'Move through poses slowly, hold each for 30 seconds',
      'Listen to your body, don\'t force stretch',
      'End with relaxation (Savasana)'
    ],
    tips: ['Use a yoga mat', 'Practice on empty stomach']
  },
  { 
    id: 'stretching',   
    name: 'Stretching',        
    nameMy: 'Regangan',        
    met: 2.3,  
    icon: 'accessibility',  
    category: 'flexibility',
    instructions: [
      'Warm up muscles first with light movement',
      'Stretch to point of tension, not pain',
      'Hold each stretch for 15-30 seconds',
      'Breathe deeply, don\'t hold breath',
      'Never bounce while stretching'
    ],
    tips: ['Stretch after workouts when muscles are warm', 'Hold stretches longer for better flexibility']
  },
  // Sports
  { 
    id: 'badminton',    
    name: 'Badminton',         
    nameMy: 'Badminton',         
    met: 5.5,  
    icon: 'tennisball',     
    category: 'sport',
    instructions: [
      'Warm up with light jogging and stretching',
      'Start with easy rallies to get comfortable',
      'Move quickly to the shuttle but stay balanced',
      'Use wrist shots for quick returns',
      'Cool down with stretching after playing'
    ],
    tips: ['Wear non-marking shoes', 'Stay hydrated']
  },
  { 
    id: 'futsal',       
    name: 'Futsal / Football', 
    nameMy: 'Futsal / Bola',     
    met: 7.0,  
    icon: 'football',       
    category: 'sport',
    instructions: [
      'Warm up with dribbling and passing drills',
      'Play at moderate intensity',
      'Stay aware of teammates and opponents',
      ' Communicate and work as a team',
      'Cool down with light jogging and stretching'
    ],
    tips: ['Wear shin guards', 'Play in appropriate shoes for surface']
  },
  { 
    id: 'basketball',   
    name: 'Basketball',        
    nameMy: 'Bola Keranjang',    
    met: 6.5,  
    icon: 'basketball',     
    category: 'sport',
    instructions: [
      'Warm up with shooting and dribbling drills',
      'Play at a pace you can maintain',
      'Use proper dribbling and passing techniques',
      'Work with teammates for plays',
      'Cool down with stretching'
    ],
    tips: ['Wear ankle-supporting shoes', 'Stay hydrated']
  },
  { 
    id: 'table_tennis', 
    name: 'Table Tennis',      
    nameMy: 'Ping Pong',         
    met: 4.0,  
    icon: 'disc',           
    category: 'sport',
    instructions: [
      'Warm up with easy rallies',
      'Keep your eyes on the ball',
      'Use proper grip (penhold or shakehand)',
      'Control the ball with spins and placement',
      'Cool down with arm stretches'
    ],
    tips: ['Practice basic shots first', 'Focus on consistency over power']
  },
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
