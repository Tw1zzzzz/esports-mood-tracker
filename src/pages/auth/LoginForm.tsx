import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { login } from '../../services/auth';

const LoginForm: React.FC = () => {
  const router = useRouter();
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailValue.trim() || !passwordValue.trim()) {
      toast.error("Заполните все поля");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await login(emailValue, passwordValue);
      
      if (result.success) {
        toast.success("Вход выполнен успешно");
        router.push("/dashboard");
      } else {
        toast.error(result.error || "Ошибка при входе");
      }
    } catch (error) {
      console.error("Ошибка при входе:", error);
      toast.error("Произошла ошибка при попытке входа");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Render your form here */}
    </div>
  );
};

export default LoginForm; 