import fetch from 'node-fetch';

const VERCEL_API_URL = 'https://api.vercel.com/v2/domains';

export async function getDnsRecords(domain: string, token: string) {
  try {
    const response = await fetch(`${VERCEL_API_URL}/${domain}/records`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      throw new Error(errorData.message || 'Failed to fetch DNS records');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching DNS records:', error);
    throw error;
  }
}

export async function addDnsRecord(domain: string, token: string, record: any) {
  try {
    const response = await fetch(`${VERCEL_API_URL}/${domain}/records`, {
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
    const response = await fetch(`${VERCEL_API_URL}/${domain}/records/${recordId}`, {
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
