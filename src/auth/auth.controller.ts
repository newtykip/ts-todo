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
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { LocalAuthGuard } from './local.guard';
import { RefreshAuthGuard } from './refresh.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    register(@Body() body) {
        return this.authService.register(body.username, body.password);
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Req() req, @Res({ passthrough: true }) res: Response) {
        const { user, token } = await this.authService.getJwtToken(req.user);
        const refreshToken = await this.authService.getRefreshToken(
            req.user.id,
        );

        const secretData = {
            token,
            refreshToken,
        };

        res.cookie('auth-cookie', secretData, { httpOnly: true });

        return {
            message: `Authenticated as ${this.authService.formatUserLog(
                user,
            )}!`,
        };
    }

    @UseGuards(RefreshAuthGuard)
    @Get('refresh')
    async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
        const { user, token } = await this.authService.getJwtToken(req.user);
        const refreshToken = await this.authService.getRefreshToken(
            req.user.id,
        );

        const secretData = {
            token,
            refreshToken,
        };

        res.cookie('auth-cookie', secretData, { httpOnly: true });

        return {
            message: `Reauthenticated as ${this.authService.formatUserLog(
                user,
            )}!`,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Req() req) {
        return req.user;
    }
}
