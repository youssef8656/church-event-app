const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const meetingsRoutes = require('./routes/meetings.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const pointsRoutes = require('./routes/points.routes');
const programRoutes = require('./routes/program.routes');
const announcementsRoutes = require('./routes/announcements.routes');
const homeRoutes = require('./routes/home.routes');
const mediaRoutes = require('./routes/media.routes');
const leaguesRoutes = require('./routes/leagues.routes');
const tasksRoutes = require('./routes/tasks.routes');
const restaurantsRoutes = require('./routes/restaurants.routes');
const teamsRoutes = require('./routes/teams.routes');
const roomsRoutes = require('./routes/rooms.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const adminRoutes = require('./routes/admin.routes');
const settingsRoutes = require('./routes/settings.routes');
const eventsRoutes = require('./routes/events.routes');

const app = express();

app.use(helmet());
// Allow the configured production origin(s) plus, in development, any
// device on the local network hitting the Vite dev server — needed to
// test from a phone (e.g. the QR scanner) via the machine's LAN IP.
const allowedOrigins = (env.clientOrigin || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // same-origin / curl / server-to-server
      if (allowedOrigins.includes(origin)) return callback(null, true);

      if (env.nodeEnv !== 'production') {
        const lanDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}):5173$/;
        if (lanDevOrigin.test(origin)) return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

// Baseline global rate limit; auth routes layer a stricter one on top.
app.use(rateLimit({ windowMs: 60 * 1000, max: 300 }));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serves locally-stored media/menu files when STORAGE_PROVIDER=local.
app.use('/uploads', express.static(require('path').resolve(env.storage.localDir)));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/program', programRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/leagues', leaguesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/events', eventsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
