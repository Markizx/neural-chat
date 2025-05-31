import Chat from '../models/chat.model';
import Message from '../models/message.model';
import { format } from 'date-fns';
import PDFDocument from 'pdfkit';
import { marked } from 'marked';

export class ExportService {
  // Export chat to JSON
  static async exportToJSON(chatId: string, userId: string): Promise<string> {
    const chat = await Chat.findOne({ _id: chatId, user: userId })
      .populate('messages')
      .lean();

    if (!chat) {
      throw new Error('Chat not found');
    }

    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: 1 })
      .lean();

    const exportData = {
      chat: {
        id: chat._id,
        title: chat.title,
        type: chat.type,
        model: chat.model,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      },
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        model: msg.model,
        usage: msg.usage,
      })),
      exportedAt: new Date(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Export chat to Markdown
  static async exportToMarkdown(chatId: string, userId: string): Promise<string> {
    const chat = await Chat.findOne({ _id: chatId, user: userId }).lean();
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: 1 })
      .lean();

    let markdown = `# ${chat.title || 'Chat Export'}\n\n`;
    markdown += `**Type:** ${chat.type}\n`;
    markdown += `**Model:** ${chat.model || 'N/A'}\n`;
    markdown += `**Created:** ${format(new Date(chat.createdAt), 'PPpp')}\n\n`;
    markdown += `---\n\n`;

    messages.forEach((msg) => {
      const timestamp = format(new Date(msg.createdAt), 'pp');
      const role = msg.role === 'user' ? '👤 You' : '🤖 Assistant';
      
      markdown += `### ${role} - ${timestamp}\n\n`;
      markdown += `${msg.content}\n\n`;
      
      if (msg.usage) {
        markdown += `*Tokens: ${msg.usage.totalTokens || 0}*\n\n`;
      }
      
      markdown += `---\n\n`;
    });

    return markdown;
  }

  // Export chat to PDF
  static async exportToPDF(chatId: string, userId: string): Promise<Buffer> {
    const chat = await Chat.findOne({ _id: chatId, user: userId }).lean();
    
    if (!chat) {
      throw new Error('Chat not found');
    }

    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: 1 })
      .lean();

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text(chat.title || 'Chat Export', { align: 'center' });
      doc.fontSize(12).text(`Type: ${chat.type}`, { align: 'center' });
      doc.fontSize(10).text(`Exported on ${format(new Date(), 'PPpp')}`, { align: 'center' });
      doc.moveDown(2);

      // Messages
      messages.forEach((msg) => {
        const role = msg.role === 'user' ? 'You' : 'Assistant';
        const timestamp = format(new Date(msg.createdAt), 'pp');

        // Role and timestamp
        doc.fontSize(12).font('Helvetica-Bold').text(`${role} - ${timestamp}`);
        doc.font('Helvetica').fontSize(11);
        
        // Convert markdown to plain text for PDF
        const plainContent = msg.content
          .replace(/[*_~`]/g, '')
          .replace(/#{1,6}\s/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        
        doc.text(plainContent, { 
          align: 'justify',
          indent: 20,
          paragraphGap: 10
        });
        
        if (msg.usage) {
          doc.fontSize(9).fillColor('gray')
            .text(`Tokens: ${msg.usage.totalTokens || 0}`, { align: 'right' });
          doc.fillColor('black');
        }
        
        doc.moveDown();
      });

      doc.end();
    });
  }

  // Export multiple chats
  static async exportMultipleChats(
    chatIds: string[], 
    userId: string, 
    format: 'json' | 'markdown' | 'pdf'
  ): Promise<{ filename: string; content: string | Buffer }> {
    const chats = await Chat.find({ 
      _id: { $in: chatIds }, 
      user: userId 
    }).lean();

    if (chats.length === 0) {
      throw new Error('No chats found');
    }

    switch (format) {
      case 'json': {
        const exports = await Promise.all(
          chats.map(chat => this.exportToJSON(chat._id.toString(), userId))
        );
        const combined = {
          chats: exports.map(e => JSON.parse(e)),
          exportedAt: new Date(),
        };
        return {
          filename: `chats-export-${Date.now()}.json`,
          content: JSON.stringify(combined, null, 2),
        };
      }

      case 'markdown': {
        const exports = await Promise.all(
          chats.map(chat => this.exportToMarkdown(chat._id.toString(), userId))
        );
        const combined = exports.join('\n\n# ---\n\n');
        return {
          filename: `chats-export-${Date.now()}.md`,
          content: combined,
        };
      }

      case 'pdf': {
        // For multiple PDFs, we'd need to merge them or create a single PDF
        // For now, just export the first one
        const content = await this.exportToPDF(chats[0]._id.toString(), userId);
        return {
          filename: `chat-export-${Date.now()}.pdf`,
          content,
        };
      }

      default:
        throw new Error('Invalid export format');
    }
  }

  // Export chat statistics
  static async exportChatStatistics(userId: string): Promise<string> {
    const chats = await Chat.find({ user: userId }).lean();
    const messages = await Message.find({ 
      chat: { $in: chats.map(c => c._id) } 
    }).lean();

    const stats = {
      totalChats: chats.length,
      totalMessages: messages.length,
      chatsByType: this.groupBy(chats, 'type'),
      messagesByRole: this.groupBy(messages, 'role'),
      tokenUsage: messages.reduce((sum, msg) => {
        return sum + (msg.usage?.totalTokens || 0);
      }, 0),
      exportedAt: new Date(),
    };

    return JSON.stringify(stats, null, 2);
  }

  private static groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((result, item) => {
      const value = item[key] || 'unknown';
      result[value] = (result[value] || 0) + 1;
      return result;
    }, {});
  }
} 