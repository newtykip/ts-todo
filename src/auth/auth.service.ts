import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as randomToken from 'rand-token';
import * as moment from 'moment';
import { formatUserLog } from 'src/helper';

type PrunedUser = Omit<
    Omit<Omit<User, 'password'>, 'refreshToken'>,
    'refreshTokenExp'
>;

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    readonly logger = new Logger();

    /**
     * Checks inputted data against the database to ensure that it is valid.
     * @param username The inputted username
     * @param password The inputted password
     * @returns If the data is valid, it returns a pruned version of the user's data. Otherwise, it returns null
     * @async
     */
    async validateUser(
        username: string,
        password: string,
    ): Promise<PrunedUser> {
        const user = await this.prisma.user.findUnique({ where: { username } });

        if (user) {
            // Ensure that the inputted password is valid
            const validPassword = await bcrypt.compare(password, user.password);

            if (validPassword) {
                // Prune the data
                const { password, refreshToken, refreshTokenExp, ...result } =
                    user;

                return result;
            } else {
                throw new BadRequestException('Wrong credentials!');
            }
        }

        return null;
    }

    /**
     * Checks the inputted username and refresh token against the database to ensure that it is valid.
     * @param username The inputted username
     * @param refreshToken The inputted refresh token
     * @returns If the data is valid, it returns a pruned version of the user's data. Otherwise, it returns null
     * @async
     */
    async validateRefreshToken(
        username: string,
        refreshToken: string,
    ): Promise<PrunedUser> {
        const user = await this.prisma.user.findUnique({ where: { username } });

        if (user) {
            // Ensure that the inputted refres token is valid
            if (refreshToken === user.refreshToken) {
                if (moment.unix(user.refreshTokenExp).isAfter()) {
                    // Prune the data
                    const {
                        password,
                        refreshToken,
                        refreshTokenExp,
                        ...result
                    } = user;

                    return result;
                }
            }
        }

        return null;
    }

    /**
     * Registers a user
     * @param username The user's username
     * @param password The user's password
     * @returns A pruned version of the user's data.
     * @async
     */
    async register(username: string, password: string): Promise<PrunedUser> {
        // Generate salt and hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the user
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

        this.logger.log(`${formatUserLog(user)} registered!`);

        // Prune the data
        const {
            password: pwd,
            refreshToken,
            refreshTokenExp,
            ...userData
        } = user;

        return userData;
    }

    /**
     * Generates a JWT token
     * @param user The user to generate the token for
     * @returns The generated JWT token
     */
    getJwtToken(user: User) {
        return this.jwtService.sign(user);
    }

    /**
     * Generates a refrehs token
     * @param user The user to generate the token for
     * @returns The generated refresh token
     * @async
     */
    async getRefreshToken(user: User): Promise<string> {
        // Generate the token and expiry date
        const refreshToken = randomToken.generate(16);
        const refreshTokenExp = moment().add(1, 'day').unix();

        // Add it to the database
        await this.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                refreshToken,
                refreshTokenExp,
            },
        });

        return refreshToken;
    }
}
