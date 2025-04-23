import { useCompany } from '../components/company-context';

export const useCompanyId = () => {
  const { idEmpresa } = useCompany();
  return idEmpresa;
};
