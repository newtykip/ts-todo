import { Module } from "@nestjs/common";
import { TodoService } from "./todo.service";
import { TodoController } from "./todo.controller";
import { PrismaService } from "src/prisma.service";

@Module({
    providers: [TodoService, PrismaService],
    controllers: [TodoController],
    exports: [TodoService],
})
export class TodoModule {}
