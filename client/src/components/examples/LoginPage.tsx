import LoginPage from '../LoginPage';

export default function LoginPageExample() {
  return (
    <LoginPage
      onLogin={(email, password) => console.log('Login:', email, password)}
      onRegister={(name, email, password) => console.log('Register:', name, email, password)}
    />
  );
}
