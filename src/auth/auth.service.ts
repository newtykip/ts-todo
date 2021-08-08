import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    private readonly logger = new Logger();

    private formatUserLog(user: User): string {
        return `User ${user.username} (ID: ${user.id})`;
    }

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

    async register(username: string, password: string) {
        // Generate salt and hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await this.prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            },
        });

        this.logger.log(`${this.formatUserLog(user)} registered!`);

        const { password: pwd, ...userData } = user;

        return userData;
    }

    async login(user: User) {
        const { password, ...payload } = user;

        this.logger.log(`${this.formatUserLog(user)} authenticated!`);

        return {
            _access: this.jwtService.sign(payload),
        };
    }
}
