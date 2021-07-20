import { CommonRoutesConfig } from '../struct/CommonRoutesConfig';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

export class UserRoutes extends CommonRoutesConfig {
	constructor(app: express.Application, prisma: PrismaClient) {
		super(app, prisma, 'UserRoutes');
	}

	configureRoutes() {
		this.app.route('/register')
			.post(async (req, res) => {
				const { body } = req;
				console.log(body);

				// Ensure that the required paramters exist
				if (!(body.username && body.password)) {
					return res.status(400).send({ error: 'Data not formatted properly.' });
				}

				// Generate salt and hash the password
				const salt = await bcrypt.genSalt(10);
				const password = await bcrypt.hash(body.password, salt);
				
				// Create a row in the database and return it
				const user = await this.prisma.user.create({
					data: {
						username: body.username,
						password
					}
				});

				res.status(201).send(user);
			});

		this.app.route('/login')
			.post(async (req, res) => {
				const { body } = req;
				const user = await this.prisma.user.findUnique({ where: { username: body.username }});

				if (user) {
					const validPassword = await bcrypt.compare(body.password, user.password);

					if (validPassword) {
						const token = jwt.sign({ name: user.username }, process.env.SECRET, { expiresIn: 60 * 2, algorithm: 'HS256' });
						res.status(200).send({ '_token': token });
					} else {
						res.status(400).send({ error: 'Invalid Password' });
					}
				} else {
					res.status(401).send({ error: 'User does not exist!' });
				}
			});

		this.app.route('/users')
			.get(async (req, res) => {
				const users = await this.prisma.user.findMany();
				res.status(202).send({ users });
			})

		return this.app;
	}
}
