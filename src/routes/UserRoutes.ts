import Routes from '../struct/Routes';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient, User } from '@prisma/client';
import winston from 'winston';

export class UserRoutes extends Routes {
	tokenList: { [key: string]: TokenSet };

	constructor(app: express.Application, prisma: PrismaClient, logger: winston.Logger) {
		super(app, prisma, logger);
		this.tokenList = {};
	}

	/**
	 * Generates a JWT for a user
	 * @param user The user to generate for
	 * @returns The generated JWT
	 */
	 generateToken(user: User): string {
		const { password, ...rest } = user;
		return jwt.sign(rest, process.env.ACCESS_SECRET, { expiresIn: '1m', algorithm: 'HS256' });
	}

	/**
	 * Generates a JWT refresh token for a user
	 * @param user The user to generate for
	 * @returns The generated JWT refresh token
	 */
	generateRefreshToken(user: User): string {
		const { password, ...rest } = user;
		return jwt.sign(rest, process.env.REFRESH_SECRET, { expiresIn: '1d', algorithm: 'HS256' });
	}

	configureRoutes() {
		// /api/register - creates a new user in the database
		this.app.route('/api/register')
			.post(async (req, res) => {
				const { body } = req;
				const { username, password } = body;

				// Ensure that the required paramters exist
				if (!(username && password)) {
					return res.status(400).send({ error: 'Please provide both a username and a password in your request.' });
				}
				
				// todo: Password requirements for security

				// Generate salt and hash the password
				const salt = await bcrypt.genSalt(10);
				const hashedPassword = await bcrypt.hash(body.password, salt);
				
				// Create the user in the database
				const user = await this.prisma.user.create({
					data: {
						username,
						password: hashedPassword
					}
				});

				// Report the creation
				const message = `User ${username} (ID: ${user.id}) has been created!`;

				res.status(201).send({ message });
				this.logger.info(message);
			});

		// /api/login - authenticates a user and returns a valid JSON Web Token
		this.app.route('/api/login')
			.post(async (req, res) => {
				const { body } = req;
				// Try to find the user in the database
				const user = await this.prisma.user.findUnique({ where: { username: body.username }});

				if (user) {
					// Ensure that the inputted password is valid
					const validPassword = await bcrypt.compare(body.password, user.password);

					if (validPassword) {
						// Create a JSON Web Token and Refresh Token and respond with them
						const token = this.generateToken(user);
						const refresh = this.generateRefreshToken(user);
						this.tokenList[refresh] = { token, refresh };

						res.status(200).send({ username: user.username, '_token': token, '_refresh': refresh });
						this.logger.info(`User ${user.username} (ID ${user.id}) authenticated!`);
					} else {
						res.status(400).send({ error: 'That password was invalid!' });
					}
				} else {
					res.status(404).send({ error: 'That u ser doesnot exist!' });
				}
			});

		// /api/token - refreshes a token using a refresh token and username
		this.app.route('/api/token')
			.post(async (req, res) => {
				const { body } = req;
				const { refreshToken, username } = body;

				// Ensure that the required parameters exist
				if (!(refreshToken && username)) {
					return res.status(400).send({ error: 'Please provide both a username and a password in your request.' });
				}

				// Ensure that the refresh token is valid
				if (!(refreshToken in this.tokenList)) {
					return res.status(400).send({ error: 'That refresh token is invalid.' });
				} else {
					// Get the specified user from the username
					const user = await this.prisma.user.findUnique({ where: { username }});

					// Generate a new token for them and save it to the list
					const token = this.generateToken(user);
					this.tokenList[refreshToken].token = token;

					// Send the token out
					res.status(200).send({ '_token': token });
				}
			})

		return this.app;
	}
}
