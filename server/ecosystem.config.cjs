module.exports = {
  apps: [
    {
      name: 'kakeibu-server',
      script: 'java',
      args: '-jar /var/www/kakeibu/server/target/kakeibu-server-1.0.0.jar',
      cwd: '/var/www/kakeibu/server',
      interpreter: 'none',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      kill_timeout: 10000,
      listen_timeout: 15000,
      restart_delay: 3000,
      env: {
        JWT_SECRET: process.env.JWT_SECRET || '',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
      },
      error_file: '/var/log/kakeibu/err.log',
      out_file: '/var/log/kakeibu/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
