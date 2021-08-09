import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as randomToken from 'rand-token';
import * as moment from 'moment';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    private readonly logger = new Logger();

    formatUserLog(user: User): string {
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

    async validateRefreshToken(username: string, refreshToken: string) {
        const user = await this.prisma.user.findUnique({ where: { username } });

        if (user) {
            // Ensure that the inputted refres token is valid
            if (refreshToken === user.refreshToken) {
                console.log(
                    moment
                        .unix(user.refreshTokenExp)
                        .format('DD/MM/YYYY HH:MM:SS'),
                );
                if (moment.unix(user.refreshTokenExp).isAfter()) {
                    const { password, ...result } = user;
                    return result;
                }
            }
        }

        return null;
    }

    async register(username: string, password: string) {
        // Generate salt and hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await this.prisma.user
            .create({
                data: {
                    username,
                    password: hashedPassword,
                },
            })
            .catch(() => {
                throw new BadRequestException(
                    `An account with the username ${username} already exists!`,
                );
            });

        this.logger.log(`${this.formatUserLog(user)} registered!`);

        const { password: pwd, ...userData } = user;

        return userData;
    }

    async getJwtToken(user: User) {
        const { password, ...payload } = user;

        this.logger.log(`${this.formatUserLog(user)} authenticated!`);

        return {
            token: this.jwtService.sign(payload),
            user,
        };
    }

    async getRefreshToken(userId: number): Promise<string> {
        const refreshToken = randomToken.generate(16);
        const refreshTokenExp = moment().add(1, 'day').unix();

        await this.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                refreshToken,
                refreshTokenExp,
            },
        });

        return refreshToken;
    }
}
