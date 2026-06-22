import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.fromAddress = this.config.get<string>('SMTP_FROM', '"HùngCinema" <no-reply@hungcinema.com>');

    if (host && port && user && pass) {
      const secure = this.config.get<boolean>('SMTP_SECURE', port === 465);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mail Transporter initialized successfully with host: ${host}`);
    } else {
      this.logger.warn('SMTP configuration is missing. MailService will run in DEVELOPMENT MOCK mode (printing OTPs to console).');
    }
  }

  async sendMail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.log(`
============================================================
📬 [DEVELOPMENT MOCK EMAIL]
To: ${to}
Subject: ${subject}
Content: ${text || html}
============================================================
      `);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      return false;
    }
  }

  async sendOtpMail(to: string, code: string): Promise<boolean> {
    const subject = `[HùngCinema] Mã xác minh đăng nhập của bạn: ${code}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff; color: #111111;">
        <div style="text-align: center; border-bottom: 2px solid #e11d48; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #e11d48; margin: 0; font-size: 26px; font-weight: 900;">HÙNGCINEMA</h2>
        </div>
        <p style="font-size: 16px; line-height: 1.5;">Chào bạn,</p>
        <p style="font-size: 16px; line-height: 1.5;">Bạn đã yêu cầu đăng nhập bằng mã xác minh vào hệ thống <strong>HùngCinema</strong>. Dưới đây là mã xác minh (OTP) của bạn:</p>
        <div style="background-color: #f4f4f5; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #e11d48;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #666; line-height: 1.5;">Mã này có hiệu lực trong vòng <strong>5 phút</strong> và chỉ sử dụng một lần. Vì lý do bảo mật, vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <p style="font-size: 14px; color: #666; line-height: 1.5; margin-top: 25px;">Nếu bạn không yêu cầu mã này, bạn có thể bỏ qua email này một cách an toàn.</p>
        <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; font-size: 12px; color: #999; text-align: center;">
          <p>© 2026 HùngCinema. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    `;
    const text = `Chào bạn, mã xác minh đăng nhập của bạn là: ${code}. Mã có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.`;
    return this.sendMail(to, subject, html, text);
  }
}
