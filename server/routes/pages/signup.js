export default async function signupPage(req, res) {
  const redirect = req.query?.redirect || '';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Create account • ScoutDeck</title>
  <style>
    :root{--blue:#0F3D91;--gold:#F5C542}*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;margin:0;background:#f6f7fb;color:#111827}
    .card{max-width:420px;margin:10vh auto;background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.08);overflow:hidden}
    .head{padding:20px 24px;background:linear-gradient(135deg,var(--blue),#174cab);color:#fff;display:flex;gap:10px;align-items:center}
    .content{padding:24px}
    label{font-weight:600;font-size:14px;margin:8px 0 4px;display:block}
    input{width:100%;padding:12px 14px;border:2px solid #e6e8ec;border-radius:10px;}
    input:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(15,61,145,.1)}
    .row{margin-top:12px}
    .btn{width:100%;padding:12px 16px;border:none;border-radius:10px;background:var(--blue);color:#fff;font-weight:700;cursor:pointer}
    .muted{color:#6b7280;font-size:12px;margin-top:8px}
    .error{color:#b91c1c;margin-top:8px;font-size:13px;display:none}
    .link{color:var(--blue);text-decoration:none;font-weight:600}
  </style>
</head>
<body>
  <div class="card">
    <div class="head"><div style="font-weight:800">Create your ScoutDeck account</div></div>
    <div class="content">
      <form id="form">
        <label>Name</label>
        <input type="text" id="name" placeholder="Coach Name" />
        <label class="row">Email</label>
        <input type="email" id="email" required placeholder="you@team.com" />
        <label class="row">Password</label>
        <input type="password" id="password" required placeholder="••••••••" />
        <div id="error" class="error"></div>
        <div class="row"><button class="btn" type="submit">Create account</button></div>
      </form>
      <div class="muted">Already have an account? <a class="link" href="/signin${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}">Sign in</a></div>
    </div>
  </div>
  <script>
    const form = document.getElementById('form');
    const errorEl = document.getElementById('error');
    const redirect = ${JSON.stringify(redirect)};
    form.addEventListener('submit', async (e)=>{
      e.preventDefault(); errorEl.style.display='none';
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      try{
        const r = await fetch('/api/auth/register', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password })});
        const data = await r.json();
        if(!r.ok){ throw new Error(data?.error || 'Register failed'); }
        if(redirect){
          const url = redirect + '#access_token=' + encodeURIComponent(data.access_token) + '&refresh_token=' + encodeURIComponent(data.refresh_token) + '&expires_in=' + encodeURIComponent(data.expires_in);
          window.location.assign(url);
        } else {
          localStorage.setItem('sd_access', data.access_token);
          localStorage.setItem('sd_refresh', data.refresh_token);
          window.location.assign('/dashboard');
        }
      }catch(err){ errorEl.textContent = err.message; errorEl.style.display='block'; }
    });
  </script>
</body>
</html>`);
} 