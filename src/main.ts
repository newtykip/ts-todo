import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as helmet from 'helmet';

dotenv.config(); // Load environmental variables

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: true,
    });

    const port = process.env.PORT ?? 1234;

    app.use(helmet());

    await app.listen(port, () => console.log(`Listening on port ${port}!`));
}

bootstrap();
