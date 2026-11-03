import { getVaultTestById } from '../src/services/vaultServer.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const id = req.query?.id || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: 'Missing test ID' });
    }
    const data = await getVaultTestById(id);
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch test' });
  }
}
