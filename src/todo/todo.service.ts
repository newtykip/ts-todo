import {
    BadRequestException,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { Todo } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TodoService {
    constructor(private readonly prisma: PrismaService) {}

    readonly logger = new Logger();

    private async getUser(userId: number) {
        return await this.prisma.user.findUnique({ where: { id: userId } });
    }

    async getUserTodos(id: number) {
        return await this.prisma.todo.findMany({ where: { ownerId: id } });
    }

    async getTodo(userId: number, todoId: string): Promise<Todo> {
        const todo = await this.prisma.todo.findUnique({
            where: { id: parseInt(todoId) },
        });

        if (!todo) {
            throw new BadRequestException('The requested todo does not exist!');
        }

        if (todo.ownerId !== userId) {
            throw new BadRequestException(
                'The authenticated user does not have access to the requested todo!',
            );
        }

        return todo;
    }

    async createTodo(userId: number, text: string): Promise<Todo> {
        // Ensure that the text was provided
        if (!text) {
            throw new BadRequestException(
                "A 'todo' text must be provided in the body!",
            );
        }

        const todo = await this.prisma.todo.create({
            data: {
                ownerId: userId,
                text,
            },
        });

        const user = await this.getUser(todo.ownerId);

        this.logger.log(
            `Created todo with ID ${todo.id} for User ${user.username} (ID: ${user.id})`,
        );

        return todo;
    }

    async deleteTodo(userId: number, todoId: string): Promise<Todo> {
        const todo = await this.getTodo(userId, todoId);

        const deletedTodo = await this.prisma.todo.delete({
            where: { id: todo.id },
        });

        const user = await this.getUser(deletedTodo.ownerId);

        this.logger.log(
            `Deleted todo with ID ${deletedTodo.id} for User ${user.username} (ID: ${user.id})`,
        );

        return deletedTodo;
    }

    async updateTodo(userId: number, todoId: string, newData: Partial<Todo>) {
        const isEmpty = Object.values(newData).every(
            (x) => x === null || x === '' || !x,
        );

        if (isEmpty) {
            throw new BadRequestException(
                'The body must contain some data to update the todo with!',
            );
        }

        const todo = await this.getTodo(userId, todoId);

        const updatedTodo = await this.prisma.todo.update({
            where: { id: todo.id },
            data: { ...newData },
        });

        const user = await this.getUser(updatedTodo.ownerId);

        this.logger.log(
            `Updated todo with ID ${updatedTodo.id} for User ${user.username} (ID: ${user.id})`,
        );

        return updatedTodo;
    }
}
