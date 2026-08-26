import { apiFetch } from '../utils/apiClient';
import fetch from 'node-fetch';

const VERCEL_API_URL = 'https://api.vercel.com/v2/domains';

export async function getDnsRecords() {
  const token = process.env.VERCEL_API_TOKEN;
  const domain = process.env.VERCEL_DOMAIN || 'tatovacesta.cz';
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token) {
    console.warn("[Vercel DNS] VERCEL_API_TOKEN chybí v process.env");
    return { records: [], error: "VERCEL_API_TOKEN chybí v konfiguračním souboru .env" };
  }

  let url = `https://api.vercel.com/v2/domains/${domain}/records`;
  if (teamId) {
    url += `?teamId=${teamId}`;
  }

  const response = await apiFetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Vercel DNS Error ${response.status}]:`, errorText);
    return { records: [], error: `Vercel API vrátilo kód ${response.status}: ${errorText}` };
  }

  const data = await response.json() as any;
  const records = Array.isArray(data)
    ? data
    : Array.isArray(data?.records)
      ? data.records
      : [];
  return { records, error: null };
}

export async function addDnsRecord(domain: string, token: string, record: any) {
  try {
    const response = await apiFetch(`${VERCEL_API_URL}/${domain}/records`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      throw new Error(errorData.message || 'Failed to add DNS record');
    }
    return response.json();
  } catch (error) {
    console.error('Error adding DNS record:', error);
    throw error;
  }
}

export async function deleteDnsRecord(domain: string, token: string, recordId: string) {
  try {
    const response = await apiFetch(`${VERCEL_API_URL}/${domain}/records/${recordId}`, {
      method: 'DELETE',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      throw new Error(errorData.message || 'Failed to delete DNS record');
    }
    return response.json();
  } catch (error) {
    console.error('Error deleting DNS record:', error);
    throw error;
  }
}
