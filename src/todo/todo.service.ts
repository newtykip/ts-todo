import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TodoService {
    constructor(private readonly prisma: PrismaService) {}

    private readonly logger = new Logger();

    async getUserTodos(id: number) {
        return await this.prisma.todo.findMany({ where: { id } });
    }

    async createTodo(userId: number, text: string) {
        // Ensure that the text was provided
        if (!text) {
            throw new BadRequestException(
                "A 'todo' text must be provided in the body!",
            );
        }

        return await this.prisma.todo.create({
            data: {
                ownerId: userId,
                text,
            },
        });
    }
}
