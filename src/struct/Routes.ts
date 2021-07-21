import { PrismaClient, User } from '@prisma/client';
import express from 'express';
import winston from 'winston';
import jwt from 'jsonwebtoken';

export default abstract class Routes {
	app: express.Application;
	prisma: PrismaClient;
	logger: winston.Logger;

	constructor(app: express.Application, prisma: PrismaClient, logger: winston.Logger) {
		this.app = app;
		this.prisma = prisma;
		this.logger = logger;
		this.configureRoutes();
	}

	abstract configureRoutes(): express.Application;
}
