/**
 * AssistantChat — a modal chat with "Slimora assistant".
 * Answers food / health / weight-loss questions via chatWithAssistant().
 * Self-contained: message list, text input, send, loading state.
 */
import { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, PaperPlane } from 'phosphor-react-native';
import { cute, radius, cuteShadow, withAlpha } from '@/theme/cute';
import { MascotBuddy } from '@/components/art/MascotBuddy';
import { chatWithAssistant, type ChatMessage, type AssistantContext } from '@/services/assistant';
import { useProfileStore } from '@/stores/profileStore';
import { useWeightStore } from '@/stores/weightStore';
import { useWaterStore } from '@/stores/waterStore';
import { useFoodStore } from '@/stores/foodStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useStatsStore } from '@/stores/statsStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  'How am I doing today?',
  'How many calories do I have left?',
  'What should I eat for dinner?',
  'How can I lose weight faster?',
];

/**
 * Pulls the user's live numbers out of the stores at send time, so the model
 * answers from today's real data rather than whatever was true when the sheet
 * was first opened.
 */
function snapshotContext(): AssistantContext {
  const profile = useProfileStore.getState().profile;
  const weight = useWeightStore.getState();
  const water = useWaterStore.getState().today;
  const food = useFoodStore.getState();
  const burned = Number(useWorkoutStore.getState().totalBurned) || 0;
  const streaks = useStatsStore.getState().streakMap;

  const dayLogs = food.dayLogs ?? [];
  const totals = dayLogs.reduce(
    (a, l) => ({
      calories: a.calories + Number(l.calories || 0),
      proteinG: a.proteinG + Number(l.proteinG || 0),
      carbsG: a.carbsG + Number(l.carbsG || 0),
      fatG: a.fatG + Number(l.fatG || 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const currentWeight = Number(weight.todayLog?.weightKg) || Number(profile?.weightKg) || null;
  const startWeight = weight.logs?.length
    ? Number(weight.logs[0].weightKg)
    : Number(profile?.weightKg) || null;

  return {
    name: profile?.name ?? null,
    age: profile?.age ?? null,
    gender: profile?.gender ?? null,
    heightCm: profile?.heightCm ?? null,
    weightKg: currentWeight,
    startWeightKg: startWeight,
    targetWeightKg: profile?.targetWeightKg ?? null,
    bmi: profile?.bmi ?? null,
    goalType: profile?.goalType ?? null,
    deadline: profile?.deadline ?? null,
    calorieTarget: Number(profile?.calorieTarget ?? profile?.tdee) || null,
    caloriesEaten: totals.calories,
    caloriesBurned: burned,
    proteinG: totals.proteinG,
    carbsG: totals.carbsG,
    fatG: totals.fatG,
    waterMl: Number(water?.totalMl) || 0,
    waterGoalMl: Number(water?.goalMl) || null,
    foodStreak: Number(streaks?.['food']?.current) || 0,
    todayFoods: dayLogs.map((l: any) => String(l.foodName)).filter(Boolean),
    language: profile?.language ?? null,
  };
}

function greeting(): ChatMessage {
  const name = useProfileStore.getState().profile?.name;
  return {
    role: 'assistant',
    content: name
      ? `Hi ${name}! Ask me about your weight, what you've eaten, or how to reach your goal.`
      : "Hi! I'm your Slimora assistant. Ask me about your weight, your food, or how to lose weight.",
  };
}

export function AssistantChat({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([greeting()]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setMessages([greeting()]);
      setInput('');
    }
  }, [visible]);

  const ask = async (text: string) => {
    if (!text || busy) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const reply = await chatWithAssistant(next, snapshotContext());
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Hmm, something went wrong. Try again.' }]);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  const send = () => ask(input.trim());

  const isUser = (r: string) => r === 'user';
  // Only offer the starters before the conversation actually begins.
  const showSuggestions = messages.length === 1 && !busy;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <KeyboardAvoidingView
        style={[styles.backdrop, { paddingBottom: insets.bottom }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MascotBuddy size={36} mood="happy" animated={false} />
              <Text style={styles.headerTitle}>Slimora assistant</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <X size={22} color={cute.inkSoft} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesPad}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m, i) => (
              <View
                key={i}
                style={[styles.bubbleRow, isUser(m.role) ? styles.rowRight : styles.rowLeft]}
              >
                <View
                  style={[
                    styles.bubble,
                    isUser(m.role)
                      ? { backgroundColor: '#1A1A1A' }
                      : { backgroundColor: withAlpha(cute.coral, 0.12), borderWidth: 1, borderColor: withAlpha(cute.coral, 0.25) },
                  ]}
                >
                  <Text style={[styles.bubbleText, isUser(m.role) ? { color: '#fff' } : { color: cute.ink }]}>
                    {m.content}
                  </Text>
                </View>
              </View>
            ))}
            {busy && (
              <View style={[styles.bubbleRow, styles.rowLeft]}>
                <View style={[styles.bubble, { backgroundColor: withAlpha(cute.coral, 0.12) }]}>
                  <ActivityIndicator size="small" color={cute.coral} />
                </View>
              </View>
            )}

            {showSuggestions && (
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((q) => (
                  <TouchableOpacity key={q} style={styles.chip} onPress={() => ask(q)} activeOpacity={0.8}>
                    <Text style={styles.chipText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ask about food, health, weight loss…"
              placeholderTextColor={cute.inkFaint}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { opacity: busy || !input.trim() ? 0.5 : 1 }]}
              onPress={send}
              disabled={busy || !input.trim()}
            >
              <PaperPlane size={20} color="#fff" weight="bold" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FAF4E4',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '82%',
    paddingTop: 14,
    paddingHorizontal: 16,
    ...cuteShadow.lg,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: cute.ink },
  closeBtn: { padding: 6 },
  messages: { flex: 1 },
  messagesPad: { paddingVertical: 8, gap: 10 },
  bubbleRow: { flexDirection: 'row' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleText: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: withAlpha(cute.coral, 0.35),
  },
  chipText: { fontSize: 13, fontWeight: '600', color: cute.coralDeep },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: cute.line,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: cute.ink,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: cute.line,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
