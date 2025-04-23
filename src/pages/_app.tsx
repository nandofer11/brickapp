import { AppProps } from 'next/app';
import { CompanyProvider } from '../components/company-context';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CompanyProvider>
      <Component {...pageProps} />
    </CompanyProvider>
  );
}

export default MyApp;
