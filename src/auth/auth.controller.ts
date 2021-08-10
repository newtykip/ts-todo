import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { formatUserLog } from 'src/helper';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { LocalAuthGuard } from './local.guard';
import { RefreshAuthGuard } from './refresh.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    /** POST /api/auth/register */
    @Post('register')
    register(@Body() body) {
        return this.authService.register(body.username, body.password);
    }

    /** POST /api/auth/login */
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Req() req, @Res({ passthrough: true }) res: Response) {
        const token = this.authService.getJwtToken(req.user);
        const refreshToken = await this.authService.getRefreshToken(
            req.user.id,
        );

        res.cookie(
            'auth-cookie',
            {
                token,
                refreshToken,
            },
            { httpOnly: true },
        );

        this.authService.logger.log(
            `${formatUserLog(req.user)} authenticated!`,
        );

        return {
            message: `Authenticated as ${formatUserLog(req.user)}!`,
        };
    }

    /** GET /api/auth/profile */
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Req() req) {
        return req.user;
    }

    /** GET /api/auth/refresh */
    @UseGuards(RefreshAuthGuard)
    @Get('refresh')
    async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
        const token = this.authService.getJwtToken(req.user);
        const refreshToken = await this.authService.getRefreshToken(req.user);

        res.cookie(
            'auth-cookie',
            {
                token,
                refreshToken,
            },
            { httpOnly: true },
        );

        this.authService.logger.log(
            `${formatUserLog(req.user)} re-authenticated!`,
        );

        return {
            message: `Reauthenticated as ${formatUserLog(req.user)}!`,
        };
    }
}
