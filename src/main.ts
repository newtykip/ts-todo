import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { Logger } from '@nestjs/common';

dotenv.config(); // Load environmental variables

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: true,
    });

    const logger = new Logger();
    const port = process.env.PORT ?? 1234;
    app.setGlobalPrefix('/api/v1');

    app.use(helmet());
    app.use(cookieParser());

    await app.listen(port, () => logger.log(`Listening on port ${port}!`));
}

bootstrap();
