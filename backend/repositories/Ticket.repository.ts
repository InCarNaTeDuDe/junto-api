import { BaseRepository } from "./Base.repository";
import { Ticket } from "../entities/Ticket.entity";

export class TicketRepository extends BaseRepository<Ticket> {
  constructor() {
    super(Ticket);
  }

  async countUserTickets(sellerId: string): Promise<number> {
    return this.count({ where: { sellerId } });
  }

  override async findAll(options?: any): Promise<Ticket[]> {
    return this.repo.find({
      ...options,
      where: options?.where
        ? { ...options.where, isSold: false }
        : { isSold: false },
      order: options?.order || { createdAt: "DESC" },
    });
  }

  async findBySellerId(sellerId: string) {
    return this.find({
      where: { sellerId },
      relations: { seller: true },
      order: { createdAt: "DESC" },
    });
  }

  override async findById(id: string | number): Promise<Ticket | null> {
    return this.findOne({
      where: { id: String(id) },
      relations: { seller: true },
    });
  }

  async searchTickets(queryStr: string): Promise<Ticket[]> {
    const term = queryStr.toLowerCase();

    const all = await this.findAll();
    return all.filter(
      (t) =>
        !t.isSold &&
        (t.eventName.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term)),
    );
  }
}

export const ticketRepository = new TicketRepository();
