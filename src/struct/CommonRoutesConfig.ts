import { PrismaClient } from '@prisma/client';
import express from 'express';

export abstract class CommonRoutesConfig {
	app: express.Application;
	prisma: PrismaClient;
	name: string;

	constructor(app: express.Application, prisma: PrismaClient, name: string) {
		this.app = app;
		this.prisma = prisma;
		this.name = name;
		this.configureRoutes();
	}

	getName() {
		return this.name;
	}

	abstract configureRoutes(): express.Application;
}
