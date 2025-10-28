import MessageInput from '../MessageInput';

export default function MessageInputExample() {
  return (
    <div className="max-w-4xl bg-background">
      <MessageInput
        onSendMessage={(body, attachmentUrl) => 
          console.log('Send message:', { body, attachmentUrl })
        }
        onTyping={(isTyping) => console.log('Typing:', isTyping)}
        onFileUpload={async (file) => {
          console.log('Upload file:', file.name);
          return '/uploads/example.pdf';
        }}
      />
    </div>
  );
}
