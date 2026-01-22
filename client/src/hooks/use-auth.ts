import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@shared/routes';
import { nanoid } from 'nanoid';

const STORAGE_KEY_UID = 'bingo_uid';
const STORAGE_KEY_NAME = 'bingo_name';

export function useAuth() {
  const [uid, setUid] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY_UID));
  const [name, setName] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY_NAME));

  const register = (userName: string) => {
    const newUid = uid || nanoid();
    localStorage.setItem(STORAGE_KEY_UID, newUid);
    localStorage.setItem(STORAGE_KEY_NAME, userName);
    setUid(newUid);
    setName(userName);
    
    // In a real app we'd sync this to backend here
    return newUid;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY_UID);
    localStorage.removeItem(STORAGE_KEY_NAME);
    setUid(null);
    setName(null);
  };

  return {
    uid,
    name,
    isAuthenticated: !!uid && !!name,
    register,
    logout
  };
}
