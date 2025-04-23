import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CompanyContextProps {
  idEmpresa: number;
  setIdEmpresa: (id: number) => void;
}

const CompanyContext = createContext<CompanyContextProps | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [idEmpresa, setIdEmpresa] = useState<number>(0);

  return (
    <CompanyContext.Provider value={{ idEmpresa, setIdEmpresa }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
