import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(private authService: AuthService) {
        super();
    }

    async validate(username: string, password: string): Promise<any> {
        // Attempt to validate the user by comparing inputs with the database
        const user = await this.authService.validateUser(username, password);

        // If the user is not valid, ensure they can not access the endpoint
        if (!user) {
            throw new UnauthorizedException();
        }

        // Otherwise, continue as normal
        return user;
    }
}
