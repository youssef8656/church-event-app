const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  // ---- Permissions ----
  const scanPerm = await prisma.permission.upsert({
    where: { key: 'attendance:scan' },
    update: {},
    create: { key: 'attendance:scan', description: 'Scan QR codes and record attendance' },
  });
  await prisma.permission.upsert({
    where: { key: 'league:manage' },
    update: {},
    create: { key: 'league:manage', description: 'Manage a specific league: participants and results' },
  });
  await prisma.permission.upsert({
    where: { key: 'task:manage' },
    update: {},
    create: { key: 'task:manage', description: 'Create, assign, and verify tasks' },
  });

  // ---- Users ----
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { fullName: 'Event Admin', email: 'admin@example.com', passwordHash, role: 'ADMIN', emailVerified: true },
  });

  const servant = await prisma.user.upsert({
    where: { email: 'servant@example.com' },
    update: {},
    create: { fullName: 'Mina Servant', email: 'servant@example.com', passwordHash, role: 'SERVANT', emailVerified: true },
  });
  await prisma.userPermission.findFirst({
    where: { userId: servant.id, permissionId: scanPerm.id, scopeType: null, scopeId: null },
  }).then((existing) =>
    existing
      ? existing
      : prisma.userPermission.create({ data: { userId: servant.id, permissionId: scanPerm.id } })
  );

  const memberNames = ['Ahmed Youssef', 'Mina Samir', 'Peter George', 'John Adel', 'Mark Fady', 'Youssef Nabil', 'Kirolos Emad', 'Maria Ashraf'];
  const members = [];
  for (const name of memberNames) {
    const email = name.toLowerCase().replace(/\s+/g, '.') + '@example.com';
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { fullName: name, email, passwordHash, role: 'MEMBER', emailVerified: true },
    });
    members.push(user);
  }

  // ---- Event + 3 days ----
  const event = await prisma.event.create({
    data: {
      name: 'Church Youth Event 2026',
      startDate: new Date('2026-10-01T00:00:00'),
      endDate: new Date('2026-10-03T23:59:59'),
      timezone: 'Africa/Cairo',
      settings: {
        create: [
          { key: 'attendance.graceMinutes', value: '5' },
          { key: 'attendance.points', value: '10' },
        ],
      },
    },
  });

  const days = [];
  for (let i = 1; i <= 3; i++) {
    const day = await prisma.eventDay.create({
      data: { eventId: event.id, dayNumber: i, date: new Date(`2026-10-0${i}T00:00:00`) },
    });
    days.push(day);
  }

  // ---- Meetings per day ----
  const meetingsByDay = [
    [
      { title: 'Morning Meeting', hour: 9 },
      { title: 'Afternoon Meeting', hour: 14 },
      { title: 'Evening Meeting', hour: 19 },
    ],
    [
      { title: 'Morning Meeting', hour: 9 },
      { title: 'Game', hour: 11 },
      { title: 'Evening Meeting', hour: 19 },
    ],
    [
      { title: 'Morning Meeting', hour: 9 },
      { title: 'Closing Meeting', hour: 18 },
    ],
  ];
  const allMeetings = [];
  for (let i = 0; i < days.length; i++) {
    for (const m of meetingsByDay[i]) {
      const startTime = new Date(days[i].date);
      startTime.setHours(m.hour, 0, 0, 0);
      const meeting = await prisma.meeting.create({
        data: { eventDayId: days[i].id, title: m.title, startTime, location: 'Main Hall' },
      });
      allMeetings.push(meeting);
    }
  }

  // ---- Teams (daily) ----
  const teamNames = [
    ['Red', '#EF4444'], ['Blue', '#3B82F6'], ['Green', '#22C55E'],
  ];
  const teamsByDay = [];
  for (const day of days) {
    const dayTeams = [];
    for (const [name, colorHex] of teamNames) {
      const team = await prisma.team.create({ data: { eventDayId: day.id, name, colorHex } });
      dayTeams.push(team);
    }
    teamsByDay.push(dayTeams);
  }
  // assign members round-robin to a team per day
  for (const [dayIdx, day] of days.entries()) {
    for (let i = 0; i < members.length; i++) {
      const team = teamsByDay[dayIdx][i % teamsByDay[dayIdx].length];
      await prisma.teamAssignment.upsert({
        where: { userId_eventDayId: { userId: members[i].id, eventDayId: day.id } },
        update: {},
        create: { userId: members[i].id, eventDayId: day.id, teamId: team.id },
      });
    }
  }

  // ---- Rooms ----
  const roomLabels = ['201', '202', '203'];
  const rooms = [];
  for (const label of roomLabels) {
    rooms.push(await prisma.room.create({ data: { label, capacity: 4 } }));
  }
  for (let i = 0; i < members.length; i++) {
    const room = rooms[i % rooms.length];
    await prisma.roomAssignment.create({ data: { userId: members[i].id, roomId: room.id } });
  }

  // ---- Sample attendance + points ----
  for (let i = 0; i < members.length; i++) {
    const meeting = allMeetings[0];
    const checkInAt = new Date(meeting.startTime.getTime() + i * 60 * 1000); // stagger check-ins
    const pointsAwarded = i < 5 ? 10 : 0; // first 5 within grace period
    await prisma.attendance.create({
      data: { userId: members[i].id, meetingId: meeting.id, checkInAt, pointsAwarded },
    });
    if (pointsAwarded > 0) {
      await prisma.pointsTransaction.create({
        data: { userId: members[i].id, amount: pointsAwarded, sourceType: 'ATTENDANCE', reason: `Attendance: ${meeting.title}` },
      });
    }
    // some bonus manual points for variety
    await prisma.pointsTransaction.create({
      data: { userId: members[i].id, amount: (members.length - i) * 5, sourceType: 'MANUAL', reason: 'Welcome bonus' },
    });
  }

  // ---- Program ----
  for (const [dayIdx, day] of days.entries()) {
    for (const [j, m] of meetingsByDay[dayIdx].entries()) {
      const time = new Date(day.date);
      time.setHours(m.hour, 0, 0, 0);
      await prisma.programItem.create({
        data: { eventDayId: day.id, time, title: m.title, location: 'Main Hall', sortOrder: j },
      });
    }
  }

  // ---- Leagues ----
  await prisma.league.create({
    data: { name: 'Football League', description: 'Friendly 5-a-side tournament', location: 'Field', maxParticipants: 20, startAt: new Date('2026-10-02T11:00:00') },
  });
  await prisma.league.create({
    data: { name: 'Volleyball League', description: 'Mixed teams', location: 'Court 1', maxParticipants: 16, startAt: new Date('2026-10-02T16:00:00') },
  });

  // ---- Restaurants ----
  await prisma.restaurant.create({
    data: { name: 'Nile Grill', description: 'Grilled meats and mezze', address: 'Corniche St.', openingHours: '12:00 - 23:00' },
  });

  // ---- Announcements ----
  await prisma.announcement.create({
    data: { title: 'Welcome to the event!', content: 'We are so excited to have you. Check your Home page daily for updates.', isPinned: true, createdById: admin.id },
  });

  console.log('Seed complete.');
  console.log('Admin login: admin@example.com / Password123!');
  console.log('Servant login: servant@example.com / Password123! (has attendance:scan permission)');
  console.log('Member logins: e.g. ahmed.youssef@example.com / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
