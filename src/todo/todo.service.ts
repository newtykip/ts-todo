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

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        this.logger.log(
            `Created todo with ID ${todo.id} for User ${user.username} (ID: ${user.id})`,
        );

        return todo;
    }

    async deleteTodo(userId: number, todoId: string): Promise<Todo> {
        const todo = await this.prisma.todo.findUnique({
            where: { id: parseInt(todoId) },
        });

        if (!todo) {
            throw new BadRequestException('The requested todo does not exist!');
        }

        if (todo.ownerId !== userId) {
            throw new UnauthorizedException(
                'The authenticated user does not have access to the requested todo!',
            );
        }

        const deletedTodo = await this.prisma.todo.delete({
            where: { id: todo.id },
        });

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        this.logger.log(
            `Deleted todo with ID ${deletedTodo.id} for User ${user.username} (ID: ${user.id})`,
        );

        return deletedTodo;
    }
}
