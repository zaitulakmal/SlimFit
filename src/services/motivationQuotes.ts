/**
 * Daily motivation quote pool. One quote is picked per day (rotated by
 * day-of-year) in the user's language and scheduled as a repeating daily
 * notification. The message refreshes each time the app is opened.
 */

export interface Quote {
  title: string;
  body: string;
}

export const QUOTES_EN: Quote[] = [
  { title: 'Good Morning! 💪', body: 'Small steps every day lead to big changes. Log your first meal!' },
  { title: 'You Got This 🔥', body: "Consistency beats perfection. Just show up today." },
  { title: 'Daily Boost ⚡', body: 'Your future self will thank you for what you do today.' },
  { title: 'Keep Going 🌱', body: "Progress isn't always visible — but it's happening. Trust the process." },
  { title: 'One Day at a Time ☀️', body: "Don't count the days. Make the days count." },
  { title: 'Stay Strong 💚', body: 'A healthy outside starts from the inside. Fuel your body well today.' },
  { title: 'Morning Motivation 🚀', body: "You don't have to be extreme, just consistent." },
  { title: 'New Day, New Chance 🌅', body: "Yesterday is gone. Today is yours to win." },
  { title: 'Believe It 💫', body: 'The only bad workout is the one that never happened.' },
  { title: 'Little Wins 🏆', body: 'Every meal logged is a win. Every glass of water counts.' },
  { title: 'Health First ❤️', body: 'Take care of your body — it is the only place you have to live.' },
  { title: 'Push Forward 🎯', body: "You're one decision away from a totally different day." },
  { title: 'Stay Focused 🧭', body: 'Discipline is choosing what you want most over what you want now.' },
  { title: 'Rise & Shine ✨', body: 'Success is the sum of small efforts, repeated day in and day out.' },
];

// Kept for future use if per-language quotes are re-enabled; not used today.
export const QUOTES_MS: Quote[] = [
  { title: 'Selamat Pagi! 💪', body: 'Langkah kecil setiap hari membawa perubahan besar. Log sarapan anda!' },
  { title: 'Anda Boleh! 🔥', body: 'Konsisten lebih penting dari sempurna. Teruskan hari ini.' },
  { title: 'Suntikan Semangat ⚡', body: 'Diri anda di masa depan akan berterima kasih atas usaha hari ini.' },
  { title: 'Teruskan Usaha 🌱', body: 'Kemajuan tak selalu nampak — tapi ia sedang berlaku. Percaya pada proses.' },
  { title: 'Satu Hari Demi Satu ☀️', body: 'Jangan kira hari. Buat setiap hari bermakna.' },
  { title: 'Kekal Kuat 💚', body: 'Kesihatan luaran bermula dari dalaman. Jaga pemakanan anda hari ini.' },
  { title: 'Motivasi Pagi 🚀', body: 'Tak perlu ekstrem, cukup sekadar konsisten.' },
  { title: 'Hari Baru, Peluang Baru 🌅', body: 'Semalam sudah berlalu. Hari ini milik anda.' },
  { title: 'Percayalah 💫', body: 'Senaman yang paling teruk ialah yang tidak pernah dilakukan.' },
  { title: 'Kemenangan Kecil 🏆', body: 'Setiap makanan yang dilog adalah kemenangan. Setiap gelas air dikira.' },
  { title: 'Kesihatan Dulu ❤️', body: 'Jaga badan anda — ia satu-satunya tempat anda tinggal.' },
  { title: 'Mara ke Hadapan 🎯', body: 'Anda cuma satu keputusan dari hari yang berbeza.' },
  { title: 'Kekal Fokus 🧭', body: 'Disiplin ialah memilih apa yang anda paling mahu, bukan apa yang anda mahu sekarang.' },
  { title: 'Bangkit & Bersinar ✨', body: 'Kejayaan adalah himpunan usaha kecil, diulang setiap hari.' },
];

/** Deterministic pick: rotates through the English pool by day-of-year. */
export function quoteForToday(): Quote {
  const pool = QUOTES_EN;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return pool[dayOfYear % pool.length];
}
