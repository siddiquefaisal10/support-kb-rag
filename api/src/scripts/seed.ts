import { connectToDatabase, closeDatabase } from '../db/connection';
import { DocumentRepository } from '../repositories/documentRepository';
import { ChunkRepository } from '../repositories/chunkRepository';
import { TicketRepository } from '../repositories/ticketRepository';
import { getEmbeddingsProvider } from '../providers/factory';
import { logger } from '../utils/logger';

const sampleFAQ = `# Frequently Asked Questions

## Refunds and Returns

### What is your refund policy?
We offer a full refund within 30 days of purchase. To initiate a refund, please contact our support team with your order number. Refunds are processed within 5-7 business days.

### How do I return a product?
To return a product, log into your account, go to Order History, and click "Return Item" next to the product. Print the return label and ship the item back to us.

## Account Management

### How do I reset my password?
Click on "Forgot Password" on the login page. Enter your email address and we'll send you a password reset link. The link expires after 24 hours.

### Can I change my email address?
Yes, you can change your email address in Account Settings. You'll need to verify the new email address before the change takes effect.

## Payments and Billing

### What payment methods do you accept?
We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise customers.

### Is my payment information secure?
Yes, all payment information is encrypted using industry-standard SSL encryption. We are PCI DSS compliant and never store your credit card details.

## Support

### How can I contact support?
You can reach our support team at support@example.com or through the live chat on our website. Our business hours are Monday to Friday, 9 AM to 5 PM EST.

### What is the warranty period?
All products come with a standard one year warranty from the date of purchase. Extended warranty options are available at checkout.`;

const sampleTickets = [
  {
    subject: "Unable to login to my account",
    body: "I've been trying to login for the past hour but keep getting an error message. I've tried resetting my password but the reset email never arrives.",
    tags: ["login", "password", "urgent"],
    createdAt: new Date('2024-01-15')
  },
  {
    subject: "Refund request for order #12345",
    body: "I received the wrong item in my order. I ordered a blue widget but received a red one instead. Please process a refund or send the correct item.",
    tags: ["refund", "order", "wrong-item"],
    createdAt: new Date('2024-01-16')
  },
  {
    subject: "Payment failed but charged twice",
    body: "I tried to make a purchase yesterday and the payment failed, but I see two charges on my credit card statement. Please investigate and refund the duplicate charge.",
    tags: ["payment", "billing", "duplicate-charge"],
    createdAt: new Date('2024-01-17')
  },
  {
    subject: "How to upgrade subscription plan?",
    body: "I want to upgrade from the Basic plan to the Pro plan but can't find the option in my account settings. Can you help me upgrade?",
    tags: ["subscription", "upgrade", "account"],
    createdAt: new Date('2024-01-18')
  },
  {
    subject: "Product not working after update",
    body: "After the latest software update, the product stopped working properly. It keeps crashing every time I try to use the export feature.",
    tags: ["bug", "software", "crash"],
    createdAt: new Date('2024-01-19')
  }
];

async function seed() {
  try {
    logger.info('Starting seed process...');
    
    await connectToDatabase();
    
    const docRepo = new DocumentRepository();
    const chunkRepo = new ChunkRepository();
    const ticketRepo = new TicketRepository();
    const embeddingsProvider = await getEmbeddingsProvider('mock');
    
    // Seed FAQ document
    logger.info('Seeding FAQ document...');
    const faqDoc = await docRepo.create({
      title: 'faq.md',
      type: 'md',
      status: 'uploaded',
      content: sampleFAQ,
      createdAt: new Date(),
    });
    
    // Create chunks from FAQ
    const sections = sampleFAQ.split(/^##\s+/m).filter(s => s.trim());
    const chunks = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const lines = section.split('\n');
      const title = lines[0]?.trim() || '';
      const content = lines.slice(1).join('\n').trim();
      
      if (content) {
        const embedding = await embeddingsProvider.embed(content);
        chunks.push({
          docId: faqDoc._id!,
          text: content,
          embedding,
          meta: {
            file: 'faq.md',
            anchor: title.toLowerCase().replace(/\s+/g, '-'),
            index: i,
          },
        });
      }
    }
    
    await chunkRepo.createMany(chunks);
    await docRepo.updateStatus(faqDoc._id!, 'indexed');
    logger.info(`Created ${chunks.length} chunks from FAQ`);
    
    // Seed tickets
    logger.info('Seeding tickets...');
    const ticketsWithEmbeddings = await Promise.all(
      sampleTickets.map(async (ticket) => ({
        ...ticket,
        embedding: await embeddingsProvider.embed(`${ticket.subject} ${ticket.body}`),
      }))
    );
    
    await ticketRepo.createMany(ticketsWithEmbeddings);
    logger.info(`Created ${sampleTickets.length} sample tickets`);
    
    logger.info('Seed process completed successfully!');
  } catch (error) {
    logger.error('Seed process failed', error);
    process.exit(1);
  } finally {
    await closeDatabase();
    process.exit(0);
  }
}

seed();