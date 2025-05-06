// modules/auth/auth.controller.ts

import {
  Controller,
  Request,
  Post,
  UseGuards,
  Get,
  Body,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { Response } from 'express';

import { Role } from '@prisma/client';
import { Roles } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Request() req: any) {
    console.log(req.body);
    return this.authService.login(req.body);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const token = await this.authService.forgotPassword(forgotPasswordDto);
    return { message: 'Password reset token generated', token };
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password has been reset' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(req.user.userId, changePasswordDto);
    return { message: 'Password changed successfully' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  adminOnly(@Request() req: any) {
    return { message: 'Welcome admin' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@Request() req: any) {
    return this.authService.getProfile(req.user);
  }

  // Google Authentication Routes
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // This route initiates the Google OAuth flow
    // The guard will handle the redirection to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    // After successful Google authentication, we need to:
    // 1. Log in the user with OAuth method (no password verification)
    // 2. Redirect to the frontend with the token
    const tokenObj = await this.authService.loginWithOAuth(req.user);

    // Redirect to frontend with token
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/google?token=${tokenObj.access_token}`,
    );
  }
}
