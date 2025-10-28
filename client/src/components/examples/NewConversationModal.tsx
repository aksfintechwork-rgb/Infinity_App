import { useState } from 'react';
import NewConversationModal from '../NewConversationModal';
import { Button } from '@/components/ui/button';
import avatar1 from '@assets/stock_images/professional_busines_5a9f5906.jpg';
import avatar2 from '@assets/stock_images/professional_busines_347976e4.jpg';
import avatar3 from '@assets/stock_images/professional_busines_0c71d855.jpg';

const mockUsers = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah.j@supremotraders.com', avatar: avatar1 },
  { id: 2, name: 'Michael Chen', email: 'michael.c@supremotraders.com', avatar: avatar2 },
  { id: 3, name: 'Emily Rodriguez', email: 'emily.r@supremotraders.com', avatar: avatar3 },
  { id: 4, name: 'David Kim', email: 'david.k@supremotraders.com' },
  { id: 5, name: 'Jessica Martinez', email: 'jessica.m@supremotraders.com' },
];

export default function NewConversationModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 bg-background">
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <NewConversationModal
        open={open}
        onClose={() => setOpen(false)}
        users={mockUsers}
        onCreateConversation={(title, memberIds) =>
          console.log('Create conversation:', { title, memberIds })
        }
      />
    </div>
  );
}
