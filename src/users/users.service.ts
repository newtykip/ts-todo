import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma.service';

interface TokenSet {
    token: string;
    refresh: string;
}

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}
    private tokenList: TokenSet[] = [];

    /**
     * Generates a JWT access token
     * @param user The user to generate the token for
     * @returns The generated token
     * @private
     */
    private generateAccessToken(user: User): string {
        const { password, ...rest } = user;

        return jwt.sign(rest, process.env.ACCESS_SECRET, {
            expiresIn: '1m',
            algorithm: 'HS256',
        });
    }

    /**
     * Generates a JWT refresh token
     * @param user The user to generate the token for
     * @returns The generated token
     * @private
     */
    private generateRefreshToken(user: User): string {
        const { password, ...rest } = user;

        return jwt.sign(rest, process.env.REFRESH_SECRET, {
            expiresIn: '1d',
            algorithm: 'HS256',
        });
    }

    /**
     * Registers a user
     * @param username The user's desired username
     * @param password The user's desired password
     * @returns Response data containing the user object
     * @async
     */
    async registerUser(
        username: string,
        password: string,
    ): Promise<UserResponseData> {
        // Ensure that the required parameters exist
        if (!(username && password)) {
            return {
                status: 400,
                content: {
                    error: 'Please provide both a username and a password in your request!',
                },
            };
        }

        // todo: Password requirements for security

        // Generate salt and hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the user in the database
        const user = await this.prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            },
        });

        return {
            status: 201,
            content: {
                message: `User ${user.username} (ID: ${user.id}) has registered!`,
            },
            user,
        };
    }

    /**
     * Logs in a user
     * @param username The user's username
     * @param password The user's password
     * @returns Response data containing the user object
     * @async
     */
    async loginUser(
        username: string,
        password: string,
    ): Promise<UserResponseData> {
        // Ensure that the required parameters exist
        if (!(username && password)) {
            return {
                status: 400,
                content: {
                    error: 'Please provide both a username and a password in your request!',
                },
            };
        }

        // Try to find the user in the databse
        const user = await this.prisma.user.findUnique({ where: { username } });

        if (user) {
            // Ensure that the inputted password is valid
            const validPassword = await bcrypt.compare(password, user.password);

            if (validPassword) {
                // Create a JSON Web Token and Refresh Token and respond with them
                const token = this.generateAccessToken(user);
                const refresh = this.generateRefreshToken(user);
                this.tokenList[refresh] = { token, refresh };

                return {
                    status: 200,
                    content: {
                        username: user.username,
                        _token: token,
                        _refresh: refresh,
                    },
                    user,
                };
            } else {
                return {
                    status: 400,
                    content: {
                        error: 'That password was incorrect!',
                    },
                };
            }
        } else {
            return {
                status: 404,
                content: {
                    error: 'That user does not exist!',
                },
            };
        }
    }

    /**
     * Refresh an access token using a refresh token
     * @param username The user's username
     * @param refreshToken The user's refresh token
     * @returns A new access token for the user
     * @async
     */
    async refreshToken(
        username: string,
        refreshToken: string,
    ): Promise<UserResponseData> {
        // Ensure that the required parameters exist
        if (!(refreshToken && username)) {
            return {
                status: 400,
                content: {
                    error: 'Please provide both a username and a refresh token in your request!',
                },
            };
        }

        // Ensure that the refresh token is valid
        if (!(refreshToken in this.tokenList)) {
            return {
                status: 400,
                content: {
                    error: 'That refresh token was invalid!',
                },
            };
        } else {
            // Get the specified user from the username
            const user = await this.prisma.user.findUnique({
                where: { username },
            });

            // Generate a new token for them and save it to the list
            const token = this.generateAccessToken(user);
            this.tokenList[refreshToken].token = token;

            return {
                status: 200,
                content: {
                    _token: token,
                },
                user,
            };
        }
    }
}
