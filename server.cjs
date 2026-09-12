const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

const root = path.join(__dirname, 'dist');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  response.end(JSON.stringify(payload));
};

const parseJsonBody = (request) => new Promise((resolve, reject) => {
  let body = '';
  request.on('data', (chunk) => {
    body += chunk;
    if (body.length > 10000) reject(new Error('Request body is too large'));
  });
  request.on('end', () => {
    try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Request body must be valid JSON')); }
  });
  request.on('error', reject);
});

const numericField = (value, name) => {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be a finite number`);
  return number;
};

const calculateSafety = ({ ph, fluoride, nitrates, hardness }) => {
  const contaminated = fluoride > 1.5 || ph < 6.5 || ph > 8.5;
  const caution = nitrates > 45 || hardness > 600;
  const status = contaminated ? 'contaminated' : caution ? 'caution' : 'safe';
  const deductions = (fluoride > 1.5 ? 45 : 0) + (ph < 6.5 || ph > 8.5 ? 25 : 0) + (nitrates > 45 ? 15 : 0) + (hardness > 600 ? 10 : 0);
  return { status, safety_score: Math.max(0, 100 - deductions) };
};

const handleTests = async (request, response) => {
  if (!supabase) return sendJson(response, 503, { error: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.' });
  if (request.method === 'GET') {
    const { data, error } = await supabase.from('water_tests').select('*').order('created_at', { ascending: false });
    if (error) return sendJson(response, 500, { error: error.message });
    return sendJson(response, 200, data);
  }
  if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' });
  try {
    const body = await parseJsonBody(request);
    if (!body.location) throw new Error('location is required');
    const values = {
      location: body.location,
      ph: numericField(body.ph, 'ph'),
      fluoride: numericField(body.fluoride, 'fluoride'),
      nitrates: numericField(body.nitrates, 'nitrates'),
      hardness: numericField(body.hardness, 'hardness'),
    };
    const result = { ...values, ...calculateSafety(values) };
    const { data, error } = await supabase.from('water_tests').insert(result).select().single();
    if (error) return sendJson(response, 500, { error: error.message });
    return sendJson(response, 201, data);
  } catch (error) {
    return sendJson(response, 400, { error: error.message });
  }
};

http.createServer(async (request, response) => {
  const requestPath = decodeURIComponent(request.url.split('?')[0]);
  if (requestPath === '/api/tests') {
    if (request.method === 'OPTIONS') return sendJson(response, 204, {});
    return handleTests(request, response);
  }
  const relativePath = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = path.join(root, relativePath);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
}).listen(process.env.PORT || 5190, '0.0.0.0', () => {
  console.log(`JalRakshak server running at http://localhost:${process.env.PORT || 5190}/`);
});
