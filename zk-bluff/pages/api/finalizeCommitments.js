import { finalizeCommitments } from '@/lib/firebase-game';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'missing code' });
  try {
    await finalizeCommitments(code);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
