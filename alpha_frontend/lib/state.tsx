'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface StartedCtx { started:boolean; setStarted:(v:boolean)=>void }
const Ctx = createContext<StartedCtx | null>(null);

export function StartedProvider({ children }:{ children: React.ReactNode }){
  const [started, setStarted] = useState(false);

  useEffect(() => {
    try {
      setStarted(sessionStorage.getItem('__ae_started__') === '1');
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('__ae_started__', started ? '1' : '0');
    } catch {
      // ignore
    }
  }, [started]);

  return <Ctx.Provider value={{ started, setStarted }}>{children}</Ctx.Provider>;
}

export function useStarted(){
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStarted must be used within StartedProvider');
  return ctx;
}