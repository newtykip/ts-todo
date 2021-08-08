import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    async validateUser(
        username: string,
        password: string,
    ): Promise<Omit<User, 'password'>> {
        const user = await this.prisma.user.findUnique({ where: { username } });

        if (user) {
            // Ensure that the inputted password is valid
            const validPassword = await bcrypt.compare(password, user.password);

            if (validPassword) {
                const { password, ...result } = user;
                return result;
            }
        }

        return null;
    }

    async login(user: User) {
        const { password, ...payload } = user;

        return {
            _access: this.jwtService.sign(payload),
        };
    }
}
