import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'missing code' });
  const gameRef = doc(db, 'games', code);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return res.status(404).json({ error: 'game not found' });
  return res.status(200).json(snap.data());
}
