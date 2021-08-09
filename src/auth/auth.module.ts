import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from 'src/prisma.service';
import { AuthController } from './auth.controller';
import { RefreshStrategy } from './refresh.strategy';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.ACCESS_SECRET,
            signOptions: { expiresIn: '1m', algorithm: 'HS256' },
        }),
    ],
    providers: [
        PrismaService,
        AuthService,
        LocalStrategy,
        JwtStrategy,
        RefreshStrategy,
    ],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
