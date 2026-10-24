import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zmxrghnklvvkvrizztvx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpteHJnaG5rbHZ2a3ZyaXp6dHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTA5ODUxMSwiZXhwIjoyMTA2Njc0NTExfQ.oGIe812-8avvMBd7do2Zdz_JUUfQMx7_rK7cjWI3mQY';

export async function GET(request: Request) {
  return handleKeepAlive(request);
}

export async function POST(request: Request) {
  return handleKeepAlive(request);
}

async function handleKeepAlive(request: Request) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const report: {
    success: boolean;
    timestamp: string;
    durationMs: number;
    operations: {
      write: { table: string; status: string; error?: string };
      read: { table: string; status: string; count?: number; error?: string };
    };
    message: string;
  } = {
    success: true,
    timestamp,
    durationMs: 0,
    operations: {
      write: { table: 'keep_alive_logs', status: 'pending' },
      read: { table: 'products', status: 'pending' }
    },
    message: ''
  };

  // 1. Database WRITE Operation (Primary: keep_alive_logs, Fallback: categories ping)
  try {
    const { error: logErr } = await supabase.from('keep_alive_logs').insert([
      {
        pinged_at: timestamp,
        source: 'vercel_cron_keep_alive',
        status: 'active',
        meta: {
          userAgent: request.headers.get('user-agent') || 'cron-bot',
          referer: request.headers.get('referer') || 'none'
        }
      }
    ]);

    if (!logErr) {
      report.operations.write = { table: 'keep_alive_logs', status: 'success' };
    } else {
      // Fallback: update store_settings heartbeat
      const { error: fbErr } = await supabase
        .from('store_settings')
        .upsert([{ key: 'last_keep_alive_ping', value: { timestamp, source: 'cron_fallback' } }]);

      if (!fbErr) {
        report.operations.write = { table: 'store_settings (fallback)', status: 'success' };
      } else {
        report.operations.write = {
          table: 'keep_alive_logs',
          status: 'failed',
          error: logErr.message || fbErr.message
        };
      }
    }
  } catch (err: any) {
    report.operations.write = {
      table: 'keep_alive_logs',
      status: 'error',
      error: err.message
    };
  }

  // 2. Database READ Operation (Lightweight query on products)
  try {
    const { data: readData, error: readErr } = await supabase
      .from('products')
      .select('id, title')
      .limit(1);

    if (!readErr && readData) {
      report.operations.read = {
        table: 'products',
        status: 'success',
        count: readData.length
      };
    } else {
      report.operations.read = {
        table: 'products',
        status: 'failed',
        error: readErr?.message
      };
    }
  } catch (err: any) {
    report.operations.read = {
      table: 'products',
      status: 'error',
      error: err.message
    };
  }

  report.durationMs = Date.now() - startTime;
  report.success = report.operations.write.status === 'success' || report.operations.read.status === 'success';
  report.message = report.success
    ? 'Supabase Keep-Alive Pulse successful! Database activity refreshed.'
    : 'Keep-alive pulse encountered errors.';

  return new Response(JSON.stringify(report, null, 2), {
    status: report.success ? 200 : 500,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
