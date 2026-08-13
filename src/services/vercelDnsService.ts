import fetch from 'node-fetch';

const VERCEL_API_URL = 'https://api.vercel.com/v2/domains';

export async function getDnsRecords(domain: string, token: string) {
  const response = await fetch(`${VERCEL_API_URL}/${domain}/records`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch DNS records');
  }
  return response.json();
}

export async function addDnsRecord(domain: string, token: string, record: any) {
  const response = await fetch(`${VERCEL_API_URL}/${domain}/records`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to add DNS record');
  }
  return response.json();
}

export async function deleteDnsRecord(domain: string, token: string, recordId: string) {
  const response = await fetch(`${VERCEL_API_URL}/${domain}/records/${recordId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete DNS record');
  }
  return response.json();
}
