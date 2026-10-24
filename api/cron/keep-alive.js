/**
 * innbox E-Commerce
 * Supabase Keep-Alive & Anti-Pause Pulse (Vercel Serverless Function)
 * 
 * Scheduled to run every 3 days via Vercel Cron (0 6 * / 3 * *) & GitHub Actions.
 * Performs both WRITE and READ operations to keep Supabase free-tier database active.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zmxrghnklvvkvrizztvx.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpteHJnaG5rbHZ2a3ZyaXp6dHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwOTg1MTEsImV4cCI6MjEwNjY3NDUxMX0.bOn7TBT9ZIEkeUaIOAq1RdATI6CdNMSilHc1HsbsOjs';

async function handler(req, res) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const report = {
    success: true,
    timestamp,
    durationMs: 0,
    operations: {
      write: { table: 'keep_alive_logs', status: 'pending' },
      read: { table: 'products', status: 'pending' }
    },
    message: ''
  };

  // 1. Database WRITE Operation
  try {
    const { error: logErr } = await supabase.from('keep_alive_logs').insert([
      {
        pinged_at: timestamp,
        source: 'vercel_cron_keep_alive',
        status: 'active',
        meta: {
          userAgent: (req.headers && req.headers['user-agent']) || 'cron-bot',
          ip: (req.headers && (req.headers['x-forwarded-for'] || req.socket?.remoteAddress)) || 'serverless'
        }
      }
    ]);

    if (!logErr) {
      report.operations.write = { table: 'keep_alive_logs', status: 'success' };
    } else {
      // Fallback heartbeat to store_settings
      const { error: fbErr } = await supabase
        .from('store_settings')
        .upsert([{ key: 'last_keep_alive_ping', value: { timestamp, source: 'cron_fallback' } }]);

      if (!fbErr) {
        report.operations.write = { table: 'store_settings (heartbeat fallback)', status: 'success' };
      } else {
        report.operations.write = {
          table: 'keep_alive_logs',
          status: 'failed',
          error: logErr.message || fbErr.message
        };
      }
    }
  } catch (err) {
    report.operations.write = {
      table: 'keep_alive_logs',
      status: 'error',
      error: err.message
    };
  }

  // 2. Database READ Operation
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
        error: readErr ? readErr.message : 'Unknown read error'
      };
    }
  } catch (err) {
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

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(report.success ? 200 : 500).json(report);
}

module.exports = handler;
module.exports.default = handler;
