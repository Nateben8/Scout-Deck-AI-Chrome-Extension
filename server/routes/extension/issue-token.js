export default async function issueToken(req, res) {
  try {
    const redirect = req.query?.redirect || '';
    if (!redirect) return res.status(400).json({ error: 'missing_redirect' });
    const loc = `/signin?redirect=${encodeURIComponent(redirect)}`;
    res.redirect(302, loc);
  } catch (e) {
    res.status(500).json({ error: 'server_error' });
  }
} 