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
import "./index.scss"
import Home from "./Home"
import Goals from "./Goals"
import SpinLoader from "./components/SpinLoader";
import NavigationInterceptor from "./components/NavigationInterceptor";

import {AdminContextProvider} from '../stores/ai_adminContext';

export const metadata = {
  title: 'École Administration',
  description: 'Système de gestion scolaire',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AdminContextProvider>

          {/* <Goals /> */}

          <ClerkProvider>
            <UserRoleProvider>
              <LoadingProvider>
                <Home>
                  {children}
                </Home>
                <SpinLoader />
                <NavigationInterceptor />
              </LoadingProvider>
            </UserRoleProvider>
          </ClerkProvider>

        </AdminContextProvider>
      </body>
    </html>
  );
}
