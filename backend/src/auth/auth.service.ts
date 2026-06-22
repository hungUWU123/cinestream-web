import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto } from './dto/auth.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private otpCache = new Map<string, { code: string; expiresAt: number }>();
  private tvSessionsCache = new Map<
    string,
    {
      code: string;
      userId: string | null;
      isApproved: boolean;
      expiresAt: number;
      tokens: any | null;
      user: any | null;
    }
  >();

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  createTvSession() {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    this.tvSessionsCache.set(token, {
      code,
      userId: null,
      isApproved: false,
      expiresAt,
      tokens: null,
      user: null,
    });

    return { token, code, expiresAt };
  }

  getTvSessionStatus(token: string) {
    const session = this.tvSessionsCache.get(token);
    if (!session) {
      return { expired: true };
    }

    if (session.expiresAt < Date.now()) {
      this.tvSessionsCache.delete(token);
      return { expired: true };
    }

    if (session.isApproved) {
      const result = {
        isApproved: true,
        user: session.user,
        ...session.tokens,
      };
      this.tvSessionsCache.delete(token);
      return result;
    }

    return { isApproved: false };
  }

  async approveTvSession(token: string, userId: string) {
    const session = this.tvSessionsCache.get(token);
    if (!session) {
      throw new BadRequestException('Mã xác minh TV không tồn tại hoặc đã hết hạn.');
    }

    if (session.expiresAt < Date.now()) {
      this.tvSessionsCache.delete(token);
      throw new BadRequestException('Mã xác minh TV đã hết hạn.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không hợp lệ.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị khóa.');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    session.isApproved = true;
    session.userId = user.id;
    session.tokens = tokens;
    session.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      avatar: user.avatar,
    };

    return { success: true };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const code = dto.code.trim();

    // Check existing user first to avoid invalidating OTP on simple input errors
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: dto.username }],
      },
    });

    if (existing) {
      if (existing.email === email) {
        throw new ConflictException('Email này đã được đăng ký sử dụng.');
      }
      throw new ConflictException('Tên đăng nhập này đã được sử dụng.');
    }

    // Verify OTP code
    const cached = this.otpCache.get(email);
    if (!cached) {
      throw new UnauthorizedException('Mã xác minh email không tồn tại hoặc đã hết hạn.');
    }

    if (cached.expiresAt < Date.now()) {
      this.otpCache.delete(email);
      throw new UnauthorizedException('Mã xác minh email đã hết hạn.');
    }

    if (cached.code !== code) {
      throw new UnauthorizedException('Mã xác minh email không chính xác.');
    }

    // OTP is verified, remove it from cache
    this.otpCache.delete(email);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        displayName: dto.displayName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been suspended');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.deleteMany({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.deleteMany({ where: { id: stored.id } });

    const tokens = await this.generateTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
    );

    return tokens;
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async sendOtp(dto: SendOtpDto) {
    const email = dto.email.toLowerCase().trim();
    // Generate a 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Expiration is 5 minutes from now
    const expiresAt = Date.now() + 5 * 60 * 1000;

    this.otpCache.set(email, { code, expiresAt });

    // Send email
    const success = await this.mailService.sendOtpMail(email, code);
    if (!success) {
      throw new BadRequestException('Không thể gửi mã xác minh về email của bạn. Vui lòng kiểm tra lại địa chỉ email.');
    }

    return { success: true, message: 'Mã xác minh đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư.' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.toLowerCase().trim();
    const code = dto.code.trim();

    const cached = this.otpCache.get(email);
    if (!cached) {
      throw new UnauthorizedException('Mã xác minh không tồn tại hoặc đã hết hạn.');
    }

    if (cached.expiresAt < Date.now()) {
      this.otpCache.delete(email);
      throw new UnauthorizedException('Mã xác minh đã hết hạn.');
    }

    if (cached.code !== code) {
      throw new UnauthorizedException('Mã xác minh không chính xác.');
    }

    // OTP is verified and correct, remove it from cache
    this.otpCache.delete(email);

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Auto-register the user
      // Generate a unique username
      const username = `user_${Math.random().toString(36).substring(2, 8)}`;
      
      // Part of email before @ as displayName
      const displayName = email.split('@')[0];
      
      // Random password hash since they won't need it
      const randomPassword = Math.random().toString(36).substring(2, 15);
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await this.prisma.user.create({
        data: {
          email,
          username,
          displayName,
          passwordHash,
        },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa.');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }
}
