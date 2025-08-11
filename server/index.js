import express from 'express';
import cors from 'cors';

import register from './routes/auth/register.js';
import login from './routes/auth/login.js';
import refresh from './routes/auth/refresh.js';
import me from './routes/auth/me.js';
import upsertPlay from './routes/extension/plays.js';
import signinPage from './routes/pages/signin.js';
import signupPage from './routes/pages/signup.js';

const app = express();
app.use(cors({ origin: [/^https:\/\/[a-z0-9-]+\.chromiumapp\.org$/, /https:\/\/.*scoutdeck\.ai$/], credentials: false }));
app.use(express.json());

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Web auth pages
app.get('/signin', (req, res) => signinPage(req, res));
app.get('/signup', (req, res) => signupPage(req, res));

// Auth
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/extension/refresh', refresh);
app.get('/api/extension/me', me);

// Plays
app.post('/api/extension/plays', upsertPlay);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ScoutDeck API listening on :${PORT}`)); 