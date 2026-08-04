// =====================================================================
// Admin authentication middleware
// ---------------------------------------------------------------------
// Protects /api/admin routes. Verifies the `Authorization: Bearer <jwt>`
// token against Supabase Auth. If valid, loads the matching admin profile
// and attaches it to req.admin. Otherwise returns 401.
// =====================================================================
const { supabaseAdmin } = require('./supabaseClient');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    // Verify the JWT with Supabase Auth.
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    // Load the matching admin profile so the role is available downstream.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    req.admin = {
      id: user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.name || '',
      role: profile?.role || 'admin',
    };

    next();
  } catch (err) {
    console.error('[AUTH ERROR]', err);
    res.status(500).json({ error: 'Authentication service error.' });
  }
}

// Restrict a route to super admins (optional, e.g. deleting categories).
function requireSuperAdmin(req, res, next) {
  if (req.admin && req.admin.role === 'super') return next();
  return res.status(403).json({ error: 'Super admin access required.' });
}

module.exports = { requireAuth, requireSuperAdmin };
