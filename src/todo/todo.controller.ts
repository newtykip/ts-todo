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

    /** GET /api/todo */
    @UseGuards(JwtAuthGuard)
    @Get()
    async listTodos(@Req() req) {
        return await this.todoService.getUserTodos(req.user.id);
    }

    /** GET /api/todo/:id */
    @UseGuards(JwtAuthGuard)
    @Get('/:id')
    async getTodo(@Req() req, @Param() params) {
        return await this.todoService.getTodo(req.user.id, params.id);
    }

    /** POST /api/todo */
    @UseGuards(JwtAuthGuard)
    @Post()
    async createTodo(@Req() req, @Body() body) {
        return await this.todoService.createTodo(req.user.id, body.todo);
    }

    /** DELETE /api/todo/:id */
    @UseGuards(JwtAuthGuard)
    @Delete('/:id')
    async deleteTodo(@Req() req, @Param() params) {
        return await this.todoService.deleteTodo(req.user.id, params.id);
    }

    /** PATCH /api/todo/:id */
    @UseGuards(JwtAuthGuard)
    @Patch('/:id')
    async updateTodo(@Req() req, @Param() params, @Body() body) {
        return await this.todoService.updateTodo(req.user.id, params.id, {
            text: body.text,
            status: body.status,
        });
    }
}
