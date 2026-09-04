const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Church event backend listening on port ${env.port} [${env.nodeEnv}]`);
});
