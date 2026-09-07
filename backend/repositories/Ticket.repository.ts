import { BaseRepository } from "./Base.repository";
import { Ticket } from "../entities/Ticket.entity";

export class TicketRepository extends BaseRepository<Ticket> {
  constructor() {
    super(Ticket);
  }

  async countUserTickets(sellerId: string): Promise<number> {
    if (!this.isConnected) return 0;
    return this.count({ where: { sellerId } });
  }

  async findBySellerId(sellerId: string) {
    return this.find({
      where: { sellerId },
      relations: { seller: true },
      order: { createdAt: "DESC" },
    });
  }

  async findById(id: string) {
    return this.findOne({
      where: { id },
      relations: { seller: true },
    });
  }
}

export const ticketRepository = new TicketRepository();
