// =====================================================================
// Supabase client configuration
// ---------------------------------------------------------------------
// Creates the official Supabase client used across the backend.
//  - Anon key   : used for anything public / client-side.
//  - Service key: used by the backend ONLY. It bypasses Row Level
//    Security so the server can manage library content safely.
// Reads from environment variables (see ../.env.example).
// =====================================================================
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

// Shared options for both clients.
const clientOptions = {
  // Node < 22 has no native WebSocket; use the `ws` package as transport.
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// If config is missing, warn loudly at startup but don't crash the process so
// the static site can still be previewed. API calls will fail until configured.
const configured = !!(supabaseUrl && supabaseAnonKey && supabaseServiceKey);
if (!configured) {
  console.error(
    '\n[MISSING ENV] SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY ' +
    'must be set. Copy backend/.env.example to backend/.env and fill it in.\n' +
    '  The server started WITHOUT Supabase: static pages work, but data APIs will fail.\n'
  );
}

// A placeholder host (never contacted) only used to satisfy the client builder.
const PLACEHOLDER = 'https://placeholder.supabase.co';
const url = configured ? supabaseUrl : PLACEHOLDER;
const anon = configured ? supabaseAnonKey : 'placeholder-anon';
const service = configured ? supabaseServiceKey : 'placeholder-service';

// Public client (anon key) - respects RLS
const supabasePublic = createClient(url, anon, clientOptions);

// Admin client (service role key) - bypasses RLS, used by all data operations
const supabaseAdmin = createClient(url, service, clientOptions);

module.exports = {
  supabaseUrl,
  supabasePublic,
  supabaseAdmin,
  configured,
};
