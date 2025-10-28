import UserMenu from '../UserMenu';
import avatar1 from '@assets/stock_images/professional_busines_5a9f5906.jpg';

export default function UserMenuExample() {
  return (
    <div className="p-6 bg-background flex justify-end">
      <UserMenu
        user={{
          name: 'Sarah Johnson',
          email: 'sarah.j@supremotraders.com',
          avatar: avatar1,
        }}
        onLogout={() => console.log('Logout clicked')}
      />
    </div>
  );
}
