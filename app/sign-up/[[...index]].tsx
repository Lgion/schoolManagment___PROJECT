"use client"

import {useEffect} from 'react'
import { SignUp } from "@clerk/nextjs"
import { useRouter } from 'next/router'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      const signInElement = document.querySelector(".cl-rootBox.cl-signUp-root");
      
      if (!signInElement) return;
      
      const handleClick = () => router.push('/');
      signInElement.addEventListener('click', handleClick);
      
      // Cleanup function
      return () => {
        signInElement.removeEventListener('click', handleClick);
      };
    }, 2000);
    
    // Cleanup timeout
    return () => clearTimeout(timer);
  }, [router]); 
  
  return <SignUp />;
}
