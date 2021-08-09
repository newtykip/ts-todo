import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
    constructor(private readonly authService: AuthService) {
        super({
            passReqToCallback: true,
            ignoreExpiration: true,
            secretOrKey: process.env.ACCESS_SECRET,
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
                    const data = req?.cookies['auth-cookie'];
                    return data ? data.token : null;
                },
            ]),
            algorithms: ['HS256'],
        });
    }

    async validate(req: Request, data: any) {
        if (data === null) {
            throw new BadRequestException('Invalid JWT token!');
        }

        let cookie = req?.cookies['auth-cookie'];

        if (!cookie?.refreshToken) {
            throw new BadRequestException('Invalid refresh token!');
        }

        const user = await this.authService.validateRefreshToken(
            data.username,
            cookie.refreshToken,
        );

        if (!user) {
            throw new BadRequestException('Refresh token has expired!');
        }

        return user;
    }
}
