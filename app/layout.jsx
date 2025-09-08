import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { UserRoleProvider } from '../stores/useUserRole';
import { LoadingProvider } from '../stores/useLoading';
import { DetailPortalProvider } from '../stores/useDetailPortal';
import "./assets/scss/index.scss"
import Home from "./Home"
import Goals from "./Goals"
import SpinLoader from "./components/SpinLoader";
import NavigationInterceptor from "./components/NavigationInterceptor";
import DetailPortalManager from "./components/DetailPortalManager";

import {AdminContextProvider} from '../stores/ai_adminContext';

export const metadata = {
  title: 'École Administration',
  description: 'Système de gestion scolaire',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        <AdminContextProvider>

          {/* <Goals /> */}

          <ClerkProvider>
            <UserRoleProvider>
              <LoadingProvider>
                <DetailPortalProvider>
                  <Home>
                    {children}
                  </Home>
                  
                  <SpinLoader />
                  <NavigationInterceptor />
                  <DetailPortalManager />
                </DetailPortalProvider>
              </LoadingProvider>
            </UserRoleProvider>
          </ClerkProvider>

        </AdminContextProvider>
      </body>
    </html>
  );
}
