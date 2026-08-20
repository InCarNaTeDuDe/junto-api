import { AppDataSource } from "../db/data-source";
import { Ticket } from "../entities/Ticket.entity";

export class TicketRepository {
  private get repo() {
    return AppDataSource.getRepository(Ticket);
  }

  async countUserTickets(sellerId: string): Promise<number> {
    if (!AppDataSource.isInitialized) return 0;
    return this.repo.count({ where: { sellerId } });
  }

  async create(data: Partial<Ticket>) {
    const ticket = this.repo.create(data);
    return this.repo.save(ticket);
  }

  async findBySellerId(sellerId: string) {
    return this.repo.find({
      where: { sellerId },
      relations: { seller: true },
      order: { createdAt: "DESC" },
    });
  }

  async findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: { seller: true },
    });
  }
}

export const ticketRepository = new TicketRepository();
