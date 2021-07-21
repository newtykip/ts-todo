import Routes from '../struct/Routes';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';

export class UserRoutes extends Routes {
	constructor(app: express.Application, prisma: PrismaClient, logger: winston.Logger) {
		super(app, prisma, logger, 'UserRoutes');
	}

	configureRoutes() {
		// /register - creates a new user in the database
		this.app.route('/register')
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

		// /login - authenticates a user and returns a valid JSON Web Token
		this.app.route('/login')
			.post(async (req, res) => {
				const { body } = req;
				// Try to find the user in the database
				const user = await this.prisma.user.findUnique({ where: { username: body.username }});

				if (user) {
					// Ensure that the inputted password is valid
					const validPassword = await bcrypt.compare(body.password, user.password);

					if (validPassword) {
						// Create a JSON Web Token and respond with it
						const token = jwt.sign({ name: user.username }, process.env.SECRET, { expiresIn: 60 * 2, algorithm: 'HS256' });
						res.status(200).send({ '_token': token });
						this.logger.info(`User ${user.username} (ID ${user.id}) authenticated!`)
					} else {
						res.status(400).send({ error: 'That password was invalid!' });
					}
				} else {
					res.status(404).send({ error: 'That user does not exist!' });
				}
			});

		return this.app;
	}
}
