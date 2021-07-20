import express, { Router } from 'express';
import winston from 'winston';
import expressWinston from 'express-winston';
import cors from 'cors';
import { CommonRoutesConfig } from './struct/CommonRoutesConfig';
import { UserRoutes } from './routes/UserRoutes';
import http from 'http';
import debug from 'debug';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import expressJwt from 'express-jwt';
import bodyParser from 'body-parser';

// Load environmental variables
dotenv.config();

const app: express.Application = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const port = process.env.PORT ?? 1234;
const routes: CommonRoutesConfig[] = [];
const debugLog = debug('app'); 

// Set up winston
const loggerOptions: expressWinston.LoggerOptions = {
	transports: [new winston.transports.Console()],
	format: winston.format.combine(winston.format.json(), winston.format.prettyPrint(), winston.format.colorize({ all: true })) 
};

// When not debugging, log requests as one-liners
if (!process.env.DEBUG) {
	loggerOptions.meta = false;
}

// Load middlewares
app.use(express.json());
app.use(cors());
app.use(expressWinston.logger(loggerOptions));
app.use(bodyParser.json());

app.use(
	expressJwt({
		secret: process.env.SECRET,
		algorithms: ['HS256']
	})
	.unless({ path: ['/register', '/login', '/']})
);

// Simple route to ensure everything is working properly
app.get('/', (_req, res) => res.status(200).send('Server up!'));

routes.push(new UserRoutes(app, prisma));

server.listen(port, () => {
	// Create all routes
	routes.forEach(r => debugLog(`Routes configured for ${r.getName()}`));
	console.log(`Running on port ${port}!`);
});
