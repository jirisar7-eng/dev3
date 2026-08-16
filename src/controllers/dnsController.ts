import { Request, Response } from 'express';
import { getDnsRecords, addDnsRecord, deleteDnsRecord } from '../services/vercelDnsService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_DOMAIN = process.env.VERCEL_DOMAIN || 'tatovacesta.cz';

export const getDns = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await getDnsRecords();
    // Vracíme vždy 200, i když je tam error v poli, frontend si to přebere.
    res.status(200).json(result);
  } catch (err: any) {
    console.error("Vercel DNS Controller Error:", err);
    res.status(200).json({ records: [], error: "Interní chyba při načítání DNS." });
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
