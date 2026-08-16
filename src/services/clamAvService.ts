import net from 'net';

export interface ScanResult {
  status: 'CLEAN' | 'INFECTED';
  details?: string;
}

export class ClamAvService {
  private static getHost(): string {
    return process.env.CLAMAV_HOST || process.env.CLAM_HOST || 'clamav_scanner';
  }

  private static getPort(): number {
    const p = process.env.CLAMAV_PORT || process.env.CLAM_PORT;
    return p ? parseInt(p, 10) : 3310;
  }

  static async scanBuffer(buffer: Buffer): Promise<ScanResult> {
    const host = this.getHost();
    const port = this.getPort();

    return new Promise((resolve, reject) => {
      const socket = net.connect({ host, port, timeout: 10000 }, () => {
        // Send INSTREAM command
        socket.write('zINSTREAM\0');

        // Send chunk in 4-byte BE length format
        const chunkSize = 64 * 1024; // 64KB chunks
        let offset = 0;

        while (offset < buffer.length) {
          const end = Math.min(offset + chunkSize, buffer.length);
          const chunk = buffer.subarray(offset, end);

          const header = Buffer.alloc(4);
          header.writeUInt32BE(chunk.length, 0);

          socket.write(header);
          socket.write(chunk);

          offset = end;
        }

        // Send 0 length packet to signal EOF
        const zeroHeader = Buffer.alloc(4);
        zeroHeader.writeUInt32BE(0, 0);
        socket.write(zeroHeader);
      });

      let response = '';

      socket.on('data', (data) => {
        response += data.toString('utf-8');
      });

      socket.on('end', () => {
        socket.destroy();
        const trimmed = response.trim();
        if (trimmed.includes('OK')) {
          resolve({ status: 'CLEAN', details: trimmed });
        } else if (trimmed.includes('FOUND')) {
          reject(new Error(`[ClamAV Infected] V souboru byl detekován virus/škodlivý kód: ${trimmed}`));
        } else {
          reject(new Error(`[ClamAV Scan Error] Neplatná odpověď z antivirové kontroly: ${trimmed || 'Prázdná odpověď'}`));
        }
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error(`[ClamAV Unavailable] Vypršel časový limit připojení k antivirovému serveru ClamAV (${host}:${port}). Skenování selhalo (Fail-Closed).`));
      });

      socket.on('error', (err) => {
        socket.destroy();
        reject(new Error(`[ClamAV Unavailable] Připojení k antivirové službě ClamAV (${host}:${port}) selhalo: ${err.message}. Skenování selhalo (Fail-Closed).`));
      });
    });
  }
}
