import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
    constructor() {
        super({
            ignoreExpiration: false,
            secretOrKey: process.env.ACCESS_SECRET,
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
                    const data = req?.cookies["auth-cookie"];
                    return data ? data.token : null;
                },
            ]),
            algorithms: ["HS256"],
        });
    }

    async validate(payload: any) {
        // If there is no authenticated user, ensure they can not access the endpoint
        if (payload === null) {
            throw new UnauthorizedException();
        }

        // Otherwise, continue as normal
        return payload;
    }
}
