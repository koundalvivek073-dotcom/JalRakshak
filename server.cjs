const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3000;
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

app.use(express.json({ limit: '10kb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

const testFields = ['location', 'ph', 'fluoride', 'nitrates', 'hardness', 'status'];

app.get('/api/tests', async (req, res) => {
  try {
    const { data, error } = await supabase.from('water_tests').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Database request failed' });
  }
});

app.post('/api/tests', async (req, res) => {
  try {
    const payload = Object.fromEntries(testFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    if (!payload.location || !payload.status) return res.status(400).json({ error: 'location and status are required' });
    const { data, error } = await supabase.from('water_tests').insert([payload]).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data?.[0] || null);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Database request failed' });
  }
});

app.delete('/api/tests/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('water_tests').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'Test deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Database request failed' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

app.listen(port, '0.0.0.0', () => {
  console.log(`JalRakshak API running at http://localhost:${port}`);
});
