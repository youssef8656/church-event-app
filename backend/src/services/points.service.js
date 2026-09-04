const prisma = require('../config/prisma');
const { Prisma } = require('@prisma/client');

/**
 * Records a manual point adjustment (positive or negative) from an
 * admin/servant. This NEVER overwrites a stored total — totals are always
 * derived by summing this ledger, so history is fully auditable.
 */
async function adjustPoints({ userId, amount, reason, grantedById }) {
  return prisma.pointsTransaction.create({
    data: { userId, amount, sourceType: 'MANUAL', reason, grantedById },
  });
}

/**
 * Individual leaderboard using DENSE_RANK so tied users share a rank with
 * no gap in the sequence that follows (1,2,2,3 — matching product decision).
 * Computed in SQL so it scales cleanly to hundreds of users without pulling
 * every transaction row into Node.
 */
async function getIndividualLeaderboard({ limit = null } = {}) {
  const limitClause = limit ? Prisma.sql`LIMIT ${limit}` : Prisma.empty;
  const rows = await prisma.$queryRaw`
    SELECT
      u.id            AS "userId",
      u."fullName"    AS "fullName",
      COALESCE(SUM(pt.amount), 0)::int AS "points",
      DENSE_RANK() OVER (ORDER BY COALESCE(SUM(pt.amount), 0) DESC)::int AS "rank"
    FROM "User" u
    LEFT JOIN "PointsTransaction" pt ON pt."userId" = u.id
    WHERE u.role = 'MEMBER'
    GROUP BY u.id, u."fullName"
    ORDER BY "points" DESC, u."fullName" ASC
    ${limitClause}
  `;
  return rows;
}

/**
 * Same query but without a LIMIT, used to find one user's own rank/points
 * even if they're outside the top N shown on the Home page.
 */
async function getUserRank(userId) {
  const rows = await prisma.$queryRaw`
    SELECT "userId", "fullName", "points", "rank" FROM (
      SELECT
        u.id            AS "userId",
        u."fullName"    AS "fullName",
        COALESCE(SUM(pt.amount), 0)::int AS "points",
        DENSE_RANK() OVER (ORDER BY COALESCE(SUM(pt.amount), 0) DESC)::int AS "rank"
      FROM "User" u
      LEFT JOIN "PointsTransaction" pt ON pt."userId" = u.id
      WHERE u.role = 'MEMBER'
      GROUP BY u.id, u."fullName"
    ) ranked
    WHERE "userId" = ${userId}
  `;
  return rows[0] || null;
}

/**
 * Records a team-level point adjustment. Completely independent from
 * individual PointsTransaction — giving a member points never touches
 * their team's total, and giving a team points never touches any
 * member's individual total. Two separate ledgers, two separate totals.
 */
async function adjustTeamPoints({ teamId, amount, reason, grantedById }) {
  return prisma.teamPointsTransaction.create({
    data: { teamId, amount, reason, grantedById },
  });
}

async function getTeamPointsHistory(teamId) {
  return prisma.teamPointsTransaction.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Team leaderboard, computed purely from TeamPointsTransaction — never
 * from summing members' individual points.
 *  - TODAY: only this specific day's Team row (each Team is already
 *    scoped to one eventDayId, so this is simply that team's own ledger).
 *  - CUMULATIVE: sums every Team row that shares the same name across
 *    all event days (e.g. "Red" on Day 1 + "Red" on Day 2 + "Red" on Day 3),
 *    so a team's running total carries across the event even though a
 *    fresh Team record is created each day.
 */
async function getTeamLeaderboard({ eventDayId, scope = 'CUMULATIVE' }) {
  if (scope === 'TODAY') {
    const rows = await prisma.$queryRaw`
      SELECT
        t.id         AS "teamId",
        t.name       AS "teamName",
        t."colorHex" AS "colorHex",
        COALESCE(SUM(tpt.amount), 0)::int AS "points",
        DENSE_RANK() OVER (ORDER BY COALESCE(SUM(tpt.amount), 0) DESC)::int AS "rank"
      FROM "Team" t
      LEFT JOIN "TeamPointsTransaction" tpt ON tpt."teamId" = t.id
      WHERE t."eventDayId" = ${eventDayId}
      GROUP BY t.id, t.name, t."colorHex"
      ORDER BY "points" DESC, t.name ASC
    `;
    return rows;
  }

  const rows = await prisma.$queryRaw`
    SELECT
      MIN(t.id)          AS "teamId",
      t.name              AS "teamName",
      MIN(t."colorHex")   AS "colorHex",
      COALESCE(SUM(tpt.amount), 0)::int AS "points",
      DENSE_RANK() OVER (ORDER BY COALESCE(SUM(tpt.amount), 0) DESC)::int AS "rank"
    FROM "Team" t
    LEFT JOIN "TeamPointsTransaction" tpt ON tpt."teamId" = t.id
    GROUP BY t.name
    ORDER BY "points" DESC, t.name ASC
  `;
  return rows;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

module.exports = {
  adjustPoints,
  getIndividualLeaderboard,
  getUserRank,
  adjustTeamPoints,
  getTeamPointsHistory,
  getTeamLeaderboard,
};