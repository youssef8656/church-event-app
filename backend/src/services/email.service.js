const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      auth: env.email.user ? { user: env.email.user, pass: env.email.pass } : undefined,
    });
  }
  return transporter;
}

async function sendVerificationEmail(user, token) {
  const verifyUrl = `${env.clientOrigin}/verify-email?token=${token}`;

  if (env.nodeEnv === 'development' && !env.email.host) {
    // No SMTP configured locally — just log it so dev flow isn't blocked.
    // eslint-disable-next-line no-console
    console.log(`[email:dev] Verification link for ${user.email}: ${verifyUrl}`);
    return;
  }

  await getTransporter().sendMail({
    from: env.email.from,
    to: user.email,
    subject: 'Verify your email — Church Event',
    html: `<p>Hi ${user.fullName},</p><p>Please verify your email to activate your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
}

module.exports = { sendVerificationEmail };
