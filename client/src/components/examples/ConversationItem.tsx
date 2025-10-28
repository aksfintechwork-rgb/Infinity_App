import ConversationItem from '../ConversationItem';
import avatar1 from '@assets/stock_images/professional_busines_5a9f5906.jpg';

export default function ConversationItemExample() {
  return (
    <div className="w-80 bg-background p-4 space-y-2">
      <ConversationItem
        id={1}
        title="Sales Team"
        members="Sarah, Michael, John"
        isGroup={true}
        lastMessage="Sarah: Great meeting today!"
        lastMessageTime={new Date().toISOString()}
        unreadCount={3}
        onClick={() => console.log('Clicked Sales Team')}
      />
      <ConversationItem
        id={2}
        members="Michael Chen"
        isGroup={false}
        lastMessage="See you tomorrow"
        lastMessageTime={new Date(Date.now() - 3600000).toISOString()}
        avatarUrl={avatar1}
        isActive={true}
        onClick={() => console.log('Clicked Michael Chen')}
      />
      <ConversationItem
        id={3}
        members="Emily Rodriguez"
        isGroup={false}
        lastMessage="Thanks for the update"
        lastMessageTime={new Date(Date.now() - 7200000).toISOString()}
        onClick={() => console.log('Clicked Emily Rodriguez')}
      />
    </div>
  );
}
