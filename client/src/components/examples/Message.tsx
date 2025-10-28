import Message from '../Message';
import avatar1 from '@assets/stock_images/professional_busines_5a9f5906.jpg';

export default function MessageExample() {
  return (
    <div className="p-6 max-w-4xl bg-background">
      <Message
        id={1}
        senderId={1}
        senderName="Sarah Johnson"
        senderAvatar={avatar1}
        body="Hey team, just wanted to share the latest updates on the trading platform. We've made significant progress this week!"
        createdAt={new Date().toISOString()}
      />
      <Message
        id={2}
        senderId={2}
        senderName="Michael Chen"
        body="That's great news! Can you share the performance metrics?"
        createdAt={new Date().toISOString()}
        isCurrentUser
      />
      <Message
        id={3}
        senderId={1}
        senderName="Sarah Johnson"
        senderAvatar={avatar1}
        body="Sure, here's the report:"
        attachmentUrl="/uploads/q4-report.pdf"
        createdAt={new Date().toISOString()}
      />
    </div>
  );
}
