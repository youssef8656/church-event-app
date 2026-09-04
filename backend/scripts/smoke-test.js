/**
 * Smoke test — exercises the core flows end-to-end against a running
 * server and a seeded database. Not a full test suite; it's a fast
 * "did I break the golden path" check to run after setup or before a demo.
 *
 * Usage:
 *   1. Make sure the backend is running (npm run dev) with a seeded DB.
 *   2. node scripts/smoke-test.js
 *
 * It talks to the API exactly like the frontend does (login → bearer
 * token), with ONE exception: it reads a member's qrToken directly from
 * the database to simulate a scan, since the token is normally only
 * exposed baked into the downloadable QR image, not as JSON.
 */
require('dotenv').config();
const prisma = require('../src/config/prisma');

const BASE_URL = process.env.SMOKE_TEST_BASE_URL || 'http://localhost:4000/api';

let passed = 0;
let failed = 0;

function ok(label, condition, extra = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label} ${extra}`);
    failed++;
  }
}

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* some endpoints (204) have no body */
  }
  return { status: res.status, json };
}

async function login(email, password) {
  const { status, json } = await api('/auth/login', { method: 'POST', body: { email, password } });
  if (status !== 200) throw new Error(`Login failed for ${email}: ${JSON.stringify(json)}`);
  return json; // { user, accessToken }
}

async function main() {
  console.log(`\nRunning smoke test against ${BASE_URL}\n`);

  // --- Health check ---
  console.log('Health');
  const healthUrl = BASE_URL.replace(/\/api\/?$/, '') + '/health';
  const healthRes = await fetch(healthUrl);
  ok('server responds', healthRes.status === 200);

  // --- Auth: admin, servant, member logins ---
  console.log('\nAuth');
  const admin = await login('admin@example.com', 'Password123!');
  ok('admin login returns accessToken', !!admin.accessToken);
  ok('admin role is ADMIN', admin.user.role === 'ADMIN');

  const servant = await login('servant@example.com', 'Password123!');
  ok('servant login returns accessToken', !!servant.accessToken);
  ok('servant role is SERVANT', servant.user.role === 'SERVANT');

  const member = await login('ahmed.youssef@example.com', 'Password123!');
  ok('member login returns accessToken', !!member.accessToken);
  ok('member role is MEMBER', member.user.role === 'MEMBER');

  // Wrong password should fail
  const badLogin = await api('/auth/login', { method: 'POST', body: { email: 'admin@example.com', password: 'wrong' } });
  ok('wrong password is rejected', badLogin.status === 401);

  // A member must never be able to self-elevate by sending a role field.
  const spoofed = await api('/auth/register', {
    method: 'POST',
    body: { fullName: 'Spoofer', email: `spoof-${Date.now()}@example.com`, password: 'Password123!', role: 'ADMIN' },
  });
  ok('registration ignores client-supplied role', spoofed.json?.user?.role !== 'ADMIN', JSON.stringify(spoofed.json));

  // --- Home feed ---
  console.log('\nHome feed');
  const home = await api('/home', { token: member.accessToken });
  ok('home feed loads', home.status === 200);
  ok('home feed includes leaderboard.top5', Array.isArray(home.json?.leaderboard?.top5));
  ok('home feed includes team leaderboard (today + cumulative)', !!home.json?.teamLeaderboard?.today && !!home.json?.teamLeaderboard?.cumulative);

  // --- Leaderboard ranking ---
  console.log('\nLeaderboard');
  const leaderboard = await api('/leaderboard/individual', { token: member.accessToken });
  ok('leaderboard returns rows', leaderboard.json?.leaderboard?.length > 0);
  const ranks = (leaderboard.json?.leaderboard || []).map((r) => r.rank);
  ok('ranks are non-decreasing (dense rank order)', ranks.every((r, i) => i === 0 || r >= ranks[i - 1]));

  // --- Permissions: member cannot scan, servant can ---
  console.log('\nPermissions');
  const meetingsRes = await api('/meetings', { token: admin.accessToken });
  const firstMeeting = meetingsRes.json?.meetings?.[0];
  ok('at least one seeded meeting exists', !!firstMeeting);

  const memberDbUser = await prisma.user.findUnique({ where: { email: 'ahmed.youssef@example.com' } });

  const memberScanAttempt = await api('/attendance/scan', {
    method: 'POST',
    token: member.accessToken,
    body: { qrToken: memberDbUser.qrToken, meetingId: firstMeeting?.id },
  });
  ok('member without permission is forbidden from scanning', memberScanAttempt.status === 403);

  // --- Attendance scan (servant, who has attendance:scan) ---
  console.log('\nAttendance');
  // Use a member who likely hasn't checked into this particular meeting yet
  // in a fresh seed run — pick the last seeded member to reduce collision risk.
  const targetMember = await prisma.user.findFirst({
    where: { role: 'MEMBER' },
    orderBy: { createdAt: 'desc' },
  });

  const scan1 = await api('/attendance/scan', {
    method: 'POST',
    token: servant.accessToken,
    body: { qrToken: targetMember.qrToken, meetingId: firstMeeting.id },
  });
  ok('first scan succeeds (201/200 with a result)', scan1.status === 200 && scan1.json?.user);

  const scan2 = await api('/attendance/scan', {
    method: 'POST',
    token: servant.accessToken,
    body: { qrToken: targetMember.qrToken, meetingId: firstMeeting.id },
  });
  ok('duplicate scan is reported as already-checked-in, not a new record', scan2.json?.alreadyCheckedIn === true);

  const unknownScan = await api('/attendance/scan', {
    method: 'POST',
    token: servant.accessToken,
    body: { qrToken: 'not-a-real-token', meetingId: firstMeeting.id },
  });
  ok('unknown QR token is rejected with 404', unknownScan.status === 404);

  // --- League join flow ---
  console.log('\nLeagues');
  const leagues = await api('/leagues', { token: member.accessToken });
  const league = leagues.json?.leagues?.[0];
  if (league) {
    const join1 = await api(`/leagues/${league.id}/join`, { method: 'POST', token: member.accessToken });
    ok('join league succeeds or member already joined', join1.status === 201 || join1.status === 409);

    const join2 = await api(`/leagues/${league.id}/join`, { method: 'POST', token: member.accessToken });
    ok('joining twice is rejected with 409', join2.status === 409);
  } else {
    console.log('  (skipped — no leagues seeded)');
  }

  // --- Admin-only routes reject non-admins ---
  console.log('\nAuthorization boundaries');
  const memberTriesAdmin = await api('/admin/dashboard', { token: member.accessToken });
  ok('member is forbidden from admin dashboard', memberTriesAdmin.status === 403);

  const servantTriesAdmin = await api('/admin/users', { token: servant.accessToken });
  ok('servant (non-admin) is forbidden from admin user list', servantTriesAdmin.status === 403);

  const adminDashboard = await api('/admin/dashboard', { token: admin.accessToken });
  ok('admin can load dashboard stats', adminDashboard.status === 200 && typeof adminDashboard.json?.totalUsers === 'number');

  // --- Summary ---
  console.log(`\n${passed} passed, ${failed} failed\n`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error('\nSmoke test crashed:', err.message);
  await prisma.$disconnect();
  process.exit(1);
});
