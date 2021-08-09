import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
}
