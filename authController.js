// =====================================================================
// Auth controller - admin sign in / sign out / session
// ---------------------------------------------------------------------
// Uses Supabase Auth with email + password. On first sign-in we auto-create
// the matching `admins` row so no manual SQL is required.
// =====================================================================
const { supabaseAdmin } = require('./supabaseClient');

// POST /api/auth/login   { email, password }
// Returns an access token + refresh token + admin profile.
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Sign in against Supabase Auth.
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email: String(email).trim().toLowerCase(),
    password,
  });

  if (error) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const user = data.user;

  // Auto-create / refresh the admin profile row for this user.
  const adminRow = {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email.split('@')[0],
    role: user.user_metadata?.role || 'admin',
  };

  await supabaseAdmin
    .from('admins')
    .upsert(adminRow, { onConflict: 'id' });

  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    admin: {
      id: user.id,
      email: user.email,
      name: adminRow.name,
      role: adminRow.role,
    },
  });
}

// POST /api/auth/refresh   { refresh_token }
async function refresh(req, res) {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ error: 'refresh_token is required.' });
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token,
  });

  if (error) {
    return res.status(401).json({ error: 'Could not refresh session.' });
  }

  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
}

// GET /api/auth/me   (requires auth)
async function me(req, res) {
  res.json({ admin: req.admin });
}

// POST /api/auth/logout   (requires auth)
async function logout(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  await supabaseAdmin.auth.signOut(token);
  res.json({ message: 'Signed out successfully.' });
}

module.exports = { login, refresh, me, logout };
