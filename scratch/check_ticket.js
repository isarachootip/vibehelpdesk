const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log("LAST TICKETS:", tickets.map(t => ({
    ticket_id: t.ticket_id,
    ticket_no: t.ticket_no,
    subject: t.subject,
    reporter_line_id: t.reporter_line_id,
    reporter_name: t.reporter_name
  })));
  
  const messages = await prisma.ticketMessage.findMany({
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log("LAST MESSAGES:", messages);
  
  const configs = await prisma.systemConfig.findMany();
  console.log("CONFIG KEYS:", configs.map(c => c.config_key));
}

main().catch(console.error).finally(() => prisma.$disconnect());
