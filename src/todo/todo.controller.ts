import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { TodoService } from './todo.service';

@Controller('todo')
export class TodoController {
    constructor(private todoService: TodoService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    async createTodo(@Req() req, @Body() body) {
        const todo = await this.todoService.createTodo(req.user.id, body.todo);
        return todo;
    }

    @UseGuards(JwtAuthGuard)
    @Delete('/:id')
    async deleteTodo(@Req() req, @Param() params) {
        const deletedTodo = await this.todoService.deleteTodo(
            req.user.id,
            params.id,
        );

        return deletedTodo;
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async listTodos(@Req() req) {
        const todos = await this.todoService.getUserTodos(req.user.id);
        return todos;
    }

    @UseGuards(JwtAuthGuard)
    @Get('/:id')
    async getTodo(@Req() req, @Param() params) {
        const todo = await this.todoService.getTodo(req.user.id, params.id);
        return todo;
    }

    @UseGuards(JwtAuthGuard)
    @Patch('/:id')
    async updateTodo(@Req() req, @Param() params, @Body() body) {
        const updatedTodo = await this.todoService.updateTodo(
            req.user.id,
            params.id,
            {
                text: body.text,
                status: body.status,
            },
        );

        return updatedTodo;
    }
}
