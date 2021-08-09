import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { TodoService } from './todo.service';

@Controller('todo')
export class TodoController {
    constructor(private todoService: TodoService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async listTodos(@Req() req) {
        const todos = await this.todoService.getUserTodos(req.user.id);
        return todos;
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createTodo(@Req() req, @Body() body) {
        const todo = await this.todoService.createTodo(req.user.id, body.todo);
        return todo;
    }
}
