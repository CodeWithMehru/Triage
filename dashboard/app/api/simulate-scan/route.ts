import { NextResponse } from 'next/server';
import net from 'net';

export async function POST(): Promise<NextResponse> {
  return new Promise<NextResponse>((resolve) => {
    const client = new net.Socket();
    
    // Set a short timeout so the UI doesn't hang if honeypot is offline
    client.setTimeout(1000);

    const finish = (status: string, error?: string) => {
      client.destroy();
      resolve(NextResponse.json({ status, error }, { status: error ? 500 : 200 }));
    };

    client.connect(2222, '127.0.0.1', () => {
      // Successfully connected to honeypot
      finish('success');
    });

    client.on('error', (err) => {
      finish('error', err.message);
    });

    client.on('timeout', () => {
      finish('error', 'Connection timed out');
    });
  });
}
