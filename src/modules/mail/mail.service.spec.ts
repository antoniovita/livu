import { InternalServerErrorException } from '@nestjs/common';
import { MailService } from './mail.service';

describe('MailService', () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalMailFrom = process.env.MAIL_FROM;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.RESEND_API_KEY = originalApiKey;
    process.env.MAIL_FROM = originalMailFrom;
  });

  it('throws when mail config is missing', async () => {
    process.env.RESEND_API_KEY = '';
    process.env.MAIL_FROM = '';
    const service = new MailService();

    await expect(service.sendEmailChangeCode('user@example.com', '123456')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('sends resend request when configured', async () => {
    process.env.RESEND_API_KEY = 'resend-test-key';
    process.env.MAIL_FROM = 'no-reply@example.com';
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    const service = new MailService();

    await service.sendEmailChangeCode('user@example.com', '123456');

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
