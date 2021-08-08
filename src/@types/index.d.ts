// declare module 'name' {}

import { User } from '@prisma/client';

export {};

declare global {
    interface ResponseData {
        status: number;
        content: any;
    }

    type UserResponseData = ResponseData & { user?: User };
}
