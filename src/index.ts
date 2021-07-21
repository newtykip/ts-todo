import express from 'express';
import winston from 'winston';
import expressWinston from 'express-winston';
import cors from 'cors';
import { UserRoutes } from './routes/UserRoutes';
import http from 'http';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import expressJwt from 'express-jwt';
import Routes from './struct/Routes';
import moment from 'moment';

// Load environmental variables
dotenv.config();

const app: express.Application = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const port = process.env.PORT ?? 1234;
const routes: Routes[] = [];

// Set up winston
winston.addColors({
	error: 'bold red',
	warn: 'bold yellow',
	info: 'bold cyan',
	debug: 'bold white',    
	command: 'bold yellow',
	db: 'bold white'
});

const loggerOptions: expressWinston.LoggerOptions = {
	transports: [new winston.transports.Console()],
	format: winston.format.combine(winston.format.printf(log => winston.format.colorize().colorize(log.level, `${moment().format('ddd, MMM Do, YYYY h:mm A')} - ${log.level}: ${log.message}`))) 
}

const logger = winston.createLogger(loggerOptions as winston.LoggerOptions);

// When not debugging, log requests as one-liners
if (!process.env.DEBUG) {
	loggerOptions.meta = false;
}

// Load middlewares
app.use(express.json()); // Lets the app to only accept JSON input
app.use(cors());
app.use(expressWinston.logger(loggerOptions)); // Binds winston to express

app.use(
	expressJwt({
		secret: process.env.SECRET,
		algorithms: ['HS256']
	})
	.unless({ path: ['/register', '/login', '/']})
);

// Simple route to ensure everything is working properly
app.get('/', (_req, res) => res.status(200).send('Server up!'));

// Push all of the route classes to the array
routes.push(new UserRoutes(app, prisma, logger));

// Start the server
server.listen(port, () => { 
	logger.info(`Running on port ${port}!`);
});
