import { User } from '@prisma/client';

/**
 * Formats information about a user for easy logging.
 * @param user The user to compile a log for
 * @returns The compiled user log
 */
export const formatUserLog = (user: User): string =>
    `User ${user.username} (ID: ${user.id})`;

/**
 * Checks if an object is empty
 * @param o The object to check
 * @returns If the object is empty, true. Otherwise false
 */
export const isEmpty = (o: any): boolean =>
    Object.values(o).every((x) => x === null || x === '' || !x);

export enum TodoStatus {
    Todo = 1,
    Completed = 0,
}
