UPDATE email_send_state SET batch_size = 25, send_delay_ms = 50 WHERE id = 1;
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'process-email-queue'),
  schedule => '5 seconds'
);