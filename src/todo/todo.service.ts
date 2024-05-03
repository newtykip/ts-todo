import {
    BadRequestException,
    Injectable,
    Logger,
    UnauthorizedException,
} from "@nestjs/common";
import { Todo } from "@prisma/client";
import { formatUserLog, isEmpty } from "src/helper";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class TodoService {
    constructor(private readonly prisma: PrismaService) {}

    readonly logger = new Logger();

    /**
     * Gets a user by their ID.
     * @param userId The user's ID
     * @returns The user's data
     * @async
     * @private
     */
    private async getUser(userId: number) {
        return await this.prisma.user.findUnique({ where: { id: userId } });
    }

    /**
     * Gets a user's todos.
     * @param userId The user's ID
     * @returns The user's todos
     * @async
     */
    async getUserTodos(userId: number) {
        return await this.prisma.todo.findMany({ where: { ownerId: userId } });
    }

    /**
     * Get a todo by its ID.
     * @param userId The authenticated user's ID
     * @param todoId The requested todo's ID
     * @returns The todo, if the authenticated user has access to it
     * @async
     */
    async getTodo(userId: number, todoId: string): Promise<Todo> {
        // Finds the todo in the database
        const todo = await this.prisma.todo.findUnique({
            where: { id: parseInt(todoId) },
        });

        // If the todo does not exist in the database, throw an error
        if (!todo) {
            throw new BadRequestException("The requested todo does not exist!");
        }

        // If the authenticated user does not have access to the found todo, throw an error
        if (todo.ownerId !== userId) {
            throw new BadRequestException(
                "The authenticated user does not have access to the requested todo!",
            );
        }

        // Otherwise, return the todo
        return todo;
    }

    /**
     * Creates a todo.
     * @param userId The user's ID
     * @param text The text to insert into the todo
     * @returns The todo
     * @async
     */
    async createTodo(userId: number, text: string): Promise<Todo> {
        // Ensure that the text was provided
        if (!text) {
            throw new BadRequestException(
                "A 'todo' text must be provided in the body!",
            );
        }

        // Get the user's data
        const user = await this.getUser(userId);

        // Create the todo in the database
        const todo = await this.prisma.todo.create({
            data: {
                ownerId: user.id,
                text,
            },
        });

        this.logger.log(
            `Created todo with ID ${todo.id} for ${formatUserLog(user)}`,
        );

        return todo;
    }

    /**
     * Deletes a todo.
     * @param userId The authenticated user's ID
     * @param todoId The todo's ID
     * @returns The todo, if the user has access to it
     * @async
     */
    async deleteTodo(userId: number, todoId: string): Promise<Todo> {
        // Find the todo
        const todo = await this.getTodo(userId, todoId);

        // Get data about the todo's owner
        const user = await this.getUser(todo.ownerId);

        // Delete the todo
        await this.prisma.todo.delete({
            where: { id: todo.id },
        });

        this.logger.log(
            `Deleted todo with ID ${todo.id} for ${formatUserLog(user)}`,
        );

        return todo;
    }

    /**
     * Updates a todo.
     * @param userId The authenticated user's ID
     * @param todoId The todo's ID
     * @param newData The data to insert into the todo
     * @returns The todo, if the user has access to it
     * @async
     */
    async updateTodo(userId: number, todoId: string, newData: Partial<Todo>) {
        // Ensure that there is data to put into the todo
        if (isEmpty(newData)) {
            throw new BadRequestException(
                "The body must contain some data to update the todo with!",
            );
        }

        // Find the todo
        const todo = await this.getTodo(userId, todoId);

        // Get data about the todo's owner
        const user = await this.getUser(todo.ownerId);

        // Update the todo
        await this.prisma.todo.update({
            where: { id: todo.id },
            data: { ...newData },
        });

        this.logger.log(
            `Updated todo with ID ${todo.id} for ${formatUserLog(user)}`,
        );

        return todo;
    }
}
