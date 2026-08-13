import { Request, Response } from 'express';
import { getDnsRecords, addDnsRecord, deleteDnsRecord } from '../services/vercelDnsService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_DOMAIN = process.env.VERCEL_DOMAIN || 'tatovacesta.cz';

export const getDns = async (req: AuthenticatedRequest, res: Response) => {
  if (!VERCEL_API_TOKEN || !VERCEL_DOMAIN) {
    return res.status(500).json({ records: [], error: "VERCEL_API_TOKEN není nastaven v .env" });
  }
  try {
    const data = await getDnsRecords(VERCEL_DOMAIN, VERCEL_API_TOKEN);
    res.json(data);
  } catch (err: any) {
    console.error("Vercel DNS Error:", err.message);
    res.status(500).json({ records: [], error: err.message });
  }
};

export const addDns = async (req: AuthenticatedRequest, res: Response) => {
  if (!VERCEL_API_TOKEN || !VERCEL_DOMAIN) {
    return res.status(500).json({ error: "VERCEL_API_TOKEN není nastaven v .env" });
  }
  try {
    const { name, type, value, ttl } = req.body;
    const data = await addDnsRecord(VERCEL_DOMAIN, VERCEL_API_TOKEN, { name, type, value, ttl });
    res.json(data);
  } catch (err: any) {
    console.error("Vercel DNS Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const deleteDns = async (req: AuthenticatedRequest, res: Response) => {
  if (!VERCEL_API_TOKEN || !VERCEL_DOMAIN) {
    return res.status(500).json({ error: "VERCEL_API_TOKEN není nastaven v .env" });
  }
  try {
    const { recordId } = req.params;
    const data = await deleteDnsRecord(VERCEL_DOMAIN, VERCEL_API_TOKEN, recordId);
    res.json(data);
  } catch (err: any) {
    console.error("Vercel DNS Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
