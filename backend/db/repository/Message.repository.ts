import { AppDataSource } from "../data-source";
import { Message } from "../entities/Message.entity";

export class MessageRepository {
  private get repo() {
    return AppDataSource.getRepository(Message);
  }

  async findByChatId(chatId: string) {
    return this.repo.find({
      where: { chatId },
      relations: { sender: true },
      order: { timestamp: "ASC" },
    });
  }

  async createMessage(data: {
    chatId: string;
    senderId: string;
    content: string;
  }) {
    const msg = this.repo.create({
      chatId: data.chatId,
      senderId: data.senderId,
      content: data.content,
      timestamp: new Date(),
    });
    return this.repo.save(msg);
  }
}
