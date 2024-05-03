import { BadRequestException, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "./auth.service";

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, "refresh") {
    constructor(private readonly authService: AuthService) {
        super({
            passReqToCallback: true,
            ignoreExpiration: true,
            secretOrKey: process.env.ACCESS_SECRET,
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
                    const payload = req?.cookies["auth-cookie"];
                    return payload ? payload.token : null;
                },
            ]),
            algorithms: ["HS256"],
        });
    }

    async validate(req: Request, payload: any) {
        // If there is no authenticated user, ensure that they can not refresh
        if (payload === null) {
            throw new BadRequestException("Invalid JWT token!");
        }

        // Ensure that the refresh token exists, and validate it against the DB
        let cookie = req?.cookies["auth-cookie"];

        if (!cookie?.refreshToken) {
            throw new BadRequestException("Invalid refresh token!");
        }

        const user = await this.authService.validateRefreshToken(
            payload.username,
            cookie.refreshToken,
        );

        // If the refresh token has expired, ensure that they can not refresh
        if (!user) {
            throw new BadRequestException("Refresh token has expired!");
        }

        // Otherwise, continue as normal
        return user;
    }
}
