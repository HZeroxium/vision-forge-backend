// modules/auth/strategies/google.strategy.ts

import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
    });

    // Log the callback URL for debugging
    this.logger.log(
      `Google OAuth callback URL: ${configService.get<string>('GOOGLE_CALLBACK_URL')}`,
    );
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      this.logger.log('Google profile received');

      // Ensure we have email information
      if (!profile.emails || profile.emails.length === 0) {
        this.logger.error('Google profile missing email information');
        return done(new Error('Missing email information from Google profile'));
      }

      const user = await this.authService.validateOAuthLogin(profile);
      this.logger.log(`User authenticated via Google: ${user.email}`);
      return done(null, user);
    } catch (error) {
      this.logger.error(`Google authentication error: ${error.message}`);
      return done(error);
    }
  }
}
