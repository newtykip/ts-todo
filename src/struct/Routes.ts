import { PrismaClient } from '@prisma/client';
import express from 'express';
import winston from 'winston';

export default abstract class Routes {
	app: express.Application;
	prisma: PrismaClient;
	logger: winston.Logger;
	name: string;

	constructor(app: express.Application, prisma: PrismaClient, logger: winston.Logger, name: string) {
		this.app = app;
		this.prisma = prisma;
		this.logger = logger;
		this.name = name;
		this.configureRoutes();
	}

	abstract configureRoutes(): express.Application;
}
