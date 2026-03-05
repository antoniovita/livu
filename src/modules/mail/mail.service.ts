import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly resendApiKey = process.env.RESEND_API_KEY;
  private readonly mailFrom = process.env.MAIL_FROM;
  private readonly resendApiUrl = 'https://api.resend.com/emails';

  async sendEmailChangeCode(to: string, code: string): Promise<void> {
    if (!this.resendApiKey || !this.mailFrom) {
      throw new InternalServerErrorException('Mail service is not configured');
    }

    const response = await fetch(this.resendApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.mailFrom,
        to: [to],
        subject: 'Confirm your new email',
        html: `
          <p>Use this verification code to confirm your new email:</p>
          <h1 style="letter-spacing: 0.2rem;">${code}</h1>
          <p>This code expires in ${this.getOtpTtlMinutes()} minutes.</p>
        `,
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException('Unable to send verification email');
    }
  }

  private getOtpTtlMinutes() {
    return Number.parseInt(process.env.EMAIL_CHANGE_OTP_TTL_MINUTES ?? '15', 10);
  }
}
