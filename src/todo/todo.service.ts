import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class TodoService {
    constructor(private readonly prisma: PrismaService) {}

    private readonly logger = new Logger();

    async getUserTodos(id: number) {
        return await this.prisma.todo.findMany({ where: { id } });
    }
}
