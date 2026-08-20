import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ChatThreadService {
    constructor(private readonly prisma: PrismaService) {}

    list(userId: string) {
        return this.prisma.chatThread.findMany({
            where: { userId },
            orderBy: { lastMessageAt: 'desc' },
            select: { id: true, title: true, status: true, lastMessageAt: true }
        });
    }

    async create(userId: string, id: string) {
        const existing = await this.prisma.chatThread.findFirst({ where: { id, userId } });
        if (existing) return existing;
        return this.prisma.chatThread.create({ data: { id, userId } });
    }

    async get(userId: string, id: string) {
        const thread = await this.prisma.chatThread.findFirst({
            where: { id, userId },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
        if (!thread) throw new NotFoundException('会话不存在');
        return {
            id: thread.id,
            title: thread.title,
            status: thread.status,
            lastMessageAt: thread.lastMessageAt,
            headId: thread.headId,
            messages: thread.messages.map((message) => ({
                parentId: message.parentId,
                message: message.payload,
                ...(message.runConfig ? { runConfig: message.runConfig } : {})
            }))
        };
    }

    async update(userId: string, id: string, data: { title?: string; status?: string }) {
        await this.ensureOwned(userId, id);
        return this.prisma.chatThread.update({ where: { id }, data });
    }

    async delete(userId: string, id: string) {
        await this.ensureOwned(userId, id);
        await this.prisma.chatThread.delete({ where: { id } });
    }

    async saveMessage(
        userId: string,
        threadId: string,
        messageId: string,
        data: { message: Record<string, unknown>; parentId?: string | null; runConfig?: Record<string, unknown> }
    ) {
        await this.ensureOwned(userId, threadId);
        await this.prisma.$transaction([
            this.prisma.chatMessage.upsert({
                where: { threadId_id: { threadId, id: messageId } },
                create: {
                    id: messageId,
                    threadId,
                    parentId: data.parentId ?? null,
                    payload: data.message as Prisma.InputJsonValue,
                    ...(data.runConfig ? { runConfig: data.runConfig as Prisma.InputJsonValue } : {})
                },
                update: {
                    parentId: data.parentId ?? null,
                    payload: data.message as Prisma.InputJsonValue,
                    runConfig: data.runConfig ? (data.runConfig as Prisma.InputJsonValue) : Prisma.JsonNull
                }
            }),
            this.prisma.chatThread.update({
                where: { id: threadId },
                data: { headId: messageId, lastMessageAt: new Date() }
            })
        ]);
    }

    private async ensureOwned(userId: string, id: string) {
        const thread = await this.prisma.chatThread.findFirst({ where: { id, userId }, select: { id: true } });
        if (!thread) throw new NotFoundException('会话不存在');
    }
}
