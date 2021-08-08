import { Body, Controller, Logger, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    private readonly logger = new Logger();

    @Post('register')
    async register(@Body() body, @Res() res: Response) {
        // Attempt to register the user
        const { status, content } = await this.usersService.registerUser(
            body.username,
            body.password,
        );

        // Report the registration
        this.logger.log(content.message);

        return res.status(status).send(content);
    }

    @Post('login')
    async login(@Body() body, @Res() res: Response) {
        // Attempt to login the user
        const { user, status, content } = await this.usersService.loginUser(
            body.username,
            body.password,
        );

        if (user) {
            this.logger.log(
                `User ${user.username} (ID ${user.id}) authenticated!`,
            );
        }

        return res.status(status).send(content);
    }

    @Post('token')
    async token(@Body() body, @Res() res: Response) {
        // Attempt to refresh the user's token
        const { user, status, content } = await this.usersService.refreshToken(
            body.username,
            body.refreshToken,
        );

        if (user) {
            this.logger.log(
                `User ${user.username} (ID ${user.id}) access token refreshed!`,
            );
        }

        return res.status(status).send(content);
    }
}
