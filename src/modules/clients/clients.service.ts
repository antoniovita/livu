import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from 'src/infra/prisma/prisma.service';

import { LoginClientDto } from './dto/login-client.dto';
import { RegisterClientDto } from './dto/register-client.dto';
import { JwtService } from '@nestjs/jwt';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { ChangeClientPasswordDto } from './dto/change-client-password.dto';
import { RequestClientEmailChangeDto } from './dto/request-client-email-change.dto';
import { ConfirmClientEmailChangeDto } from './dto/confirm-client-email-change.dto';
import { ResendClientEmailChangeDto } from './dto/resend-client-email-change.dto';
import { MailService } from '../mail/mail.service';

const clientPublicSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async listAll() {
    return this.prisma.client.findMany({
      select: clientPublicSelect,
      where: {
        status: 'ACTIVE',
      },
    });
  }

  async listById(clientId: string) {
    const client = await this.prisma.client.findFirst({
      select: clientPublicSelect,
      where: {
        id: clientId,
        status: 'ACTIVE',
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async listAllInactive() {
    return this.prisma.client.findMany({
      select: clientPublicSelect,
      where: {
        status: 'INACTIVE',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async register(dto: RegisterClientDto) {
    const existingClient = await this.prisma.client.findFirst({
      where: {
        OR: [
          { email: dto.email },
          { pendingEmail: dto.email },
          ...(dto.phone ? [{ phone: dto.phone }] : []),
          ...(dto.phone ? [{ pendingPhone: dto.phone }] : []),
        ],
      },
    });

    if (existingClient) {
      if (existingClient.email === dto.email) {
        throw new BadRequestException('Email already in use');
      }

      if (dto.phone && existingClient.phone === dto.phone) {
        throw new BadRequestException('Phone already in use');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const client = await this.prisma.client.create({
      select: clientPublicSelect,
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash: hashedPassword,
      },
    });

    const token = await this.jwtService.signAsync({
      sub: client.id,
      email: client.email
    })

  return {
    token,
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      status: client.status,
      createdAt: client.createdAt,
    },
  };
  }

  async login(dto: LoginClientDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Email or phone is required');
    }

    if (dto.email && dto.phone) {
      throw new BadRequestException('Provide only one login identifier');
    }

    const client = await this.prisma.client.findFirst({
      select: {
        ...clientPublicSelect,
        passwordHash: true,
      },
      where: {
        ...(dto.email ? { email: dto.email } : { phone: dto.phone }),
        status: 'ACTIVE',
      },
    });

    if (!client) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, client.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwtService.signAsync({
      sub: client.id,
      email: client.email,
    });

    return {
      token,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        status: client.status,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
    };
  }


  async updateProfile(clientId: string, dto: UpdateClientProfileDto) {
    await this.ensureClientExists(clientId);

    return this.prisma.client.update({
      select: clientPublicSelect,
      where: { id: clientId },
      data: {
        name: dto.name,
      },
    });
  }

  async changePassword(clientId: string, dto: ChangeClientPasswordDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      client.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.client.update({
      where: { id: clientId },
      data: { passwordHash },
    });

    return { message: 'Password updated successfully' };
  }

  async requestEmailChange(clientId: string, dto: RequestClientEmailChangeDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, client.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (client.email === dto.newEmail) {
      throw new BadRequestException('New email must be different from current email');
    }

    const existingClient = await this.prisma.client.findFirst({
      where: {
        OR: [
          { email: dto.newEmail },
          { pendingEmail: dto.newEmail },
        ],
        NOT: { id: clientId },
      },
    });

    if (existingClient) {
      throw new BadRequestException('Email already in use');
    }

    this.assertResendCooldown(client.pendingEmailLastSentAt);

    const code = this.generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = this.createVerificationExpiry();

    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        pendingEmail: dto.newEmail,
        pendingEmailCodeHash: codeHash,
        pendingEmailCodeExpiresAt: expiresAt,
        pendingEmailAttempts: 0,
        pendingEmailLastSentAt: new Date(),
      },
    });

    await this.mailService.sendEmailChangeCode(dto.newEmail, code);

    return {
      message: 'Email change requested. Confirm the code sent to the new email address.',
    };
  }

  async confirmEmailChange(clientId: string, dto: ConfirmClientEmailChangeDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (
      !client.pendingEmail ||
      !client.pendingEmailCodeHash ||
      !client.pendingEmailCodeExpiresAt
    ) {
      throw new BadRequestException('No pending email change found');
    }

    const maxAttempts = this.getEmailChangeMaxAttempts();

    if (client.pendingEmailAttempts >= maxAttempts) {
      throw new UnauthorizedException('Verification code attempts exceeded');
    }

    const isCodeValid = await bcrypt.compare(dto.code, client.pendingEmailCodeHash);

    if (!isCodeValid) {
      await this.prisma.client.update({
        where: { id: clientId },
        data: {
          pendingEmailAttempts: {
            increment: 1,
          },
        },
      });
      throw new UnauthorizedException('Invalid verification code');
    }

    if (client.pendingEmailCodeExpiresAt < new Date()) {
      throw new UnauthorizedException('Verification code expired');
    }

    return this.prisma.client.update({
      select: clientPublicSelect,
      where: { id: clientId },
      data: {
        email: client.pendingEmail,
        pendingEmail: null,
        pendingEmailCodeHash: null,
        pendingEmailCodeExpiresAt: null,
        pendingEmailAttempts: 0,
        pendingEmailLastSentAt: null,
        emailVerifiedAt: new Date(),
      },
    });
  }

  async resendEmailChangeCode(clientId: string, dto: ResendClientEmailChangeDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (!client.pendingEmail && !dto.newEmail) {
      throw new BadRequestException('No pending email change found');
    }

    const targetEmail = dto.newEmail ?? client.pendingEmail;

    if (!targetEmail) {
      throw new BadRequestException('No pending email change found');
    }

    if (targetEmail === client.email) {
      throw new BadRequestException('New email must be different from current email');
    }

    const existingClient = await this.prisma.client.findFirst({
      where: {
        OR: [{ email: targetEmail }, { pendingEmail: targetEmail }],
        NOT: { id: clientId },
      },
    });

    if (existingClient) {
      throw new BadRequestException('Email already in use');
    }

    this.assertResendCooldown(client.pendingEmailLastSentAt);

    const code = this.generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = this.createVerificationExpiry();

    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        pendingEmail: targetEmail,
        pendingEmailCodeHash: codeHash,
        pendingEmailCodeExpiresAt: expiresAt,
        pendingEmailAttempts: 0,
        pendingEmailLastSentAt: new Date(),
      },
    });

    await this.mailService.sendEmailChangeCode(targetEmail, code);

    return {
      message: 'A new verification code was sent to your pending email address.',
    };
  }

  async deactivateAccount(clientId: string) {
    await this.ensureClientExists(clientId);

    return this.prisma.client.update({
      select: clientPublicSelect,
      where: { id: clientId },
      data: {
        status: 'INACTIVE',
      },
    });
  }

  async reactivateAccount(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client || client.status !== 'INACTIVE') {
      throw new NotFoundException('Client not found or not inactive');
    }

    return this.prisma.client.update({
      select: clientPublicSelect,
      where: { id: clientId },
      data: {
        status: 'ACTIVE',
      },
    });
  }

  private async ensureClientExists(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }

  private generateVerificationCode() {
    return randomInt(100000, 1000000).toString();
  }

  private createVerificationExpiry() {
    return new Date(Date.now() + this.getEmailChangeOtpTtlMinutes() * 60 * 1000);
  }

  private getEmailChangeOtpTtlMinutes() {
    return Number.parseInt(process.env.EMAIL_CHANGE_OTP_TTL_MINUTES ?? '15', 10);
  }

  private getEmailChangeMaxAttempts() {
    return Number.parseInt(process.env.EMAIL_CHANGE_MAX_ATTEMPTS ?? '5', 10);
  }

  private getEmailChangeResendCooldownSeconds() {
    return Number.parseInt(process.env.EMAIL_CHANGE_RESEND_COOLDOWN_SECONDS ?? '60', 10);
  }

  private assertResendCooldown(lastSentAt: Date | null) {
    if (!lastSentAt) {
      return;
    }

    const cooldownMs = this.getEmailChangeResendCooldownSeconds() * 1000;
    const availableAt = new Date(lastSentAt.getTime() + cooldownMs);

    if (availableAt > new Date()) {
      throw new BadRequestException('Please wait before requesting a new verification code');
    }
  }
}
