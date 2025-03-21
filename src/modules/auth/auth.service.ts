// modules/auth/auth.service.ts

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@users/users.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) throw new ConflictException('Email already registered');
    return this.usersService.create(registerDto);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    if (!forgotPasswordDto) throw new UnauthorizedException('Missing email');
    return this.usersService.setResetToken(forgotPasswordDto.email);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (!resetPasswordDto) throw new UnauthorizedException('Missing data');

    if (!resetPasswordDto.token)
      throw new UnauthorizedException('Missing token');

    if (!resetPasswordDto.newPassword)
      throw new UnauthorizedException('Missing new password');

    return this.usersService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    if (changePasswordDto.newPassword === changePasswordDto.oldPassword)
      throw new UnauthorizedException('New password must be different');

    return this.usersService.changePassword(
      userId,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  async getProfile(user: any) {
    return this.usersService.findById(user.userId);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  async validateOAuthLogin(profile: any) {
    const { emails, displayName } = profile;
    const email = emails[0].value;
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.create({
        email,
        password: '', // No password for OAuth user
        name: displayName,
        role: Role.USER, // Default role
      });
    }
    return user;
  }
}
