import "./index.scss"
import Home from "./Home"
import Goals from "./Goals"

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
          <Goals />
          <Home>
            {children}
          </Home>
        </AdminContextProvider>
      </body>
    </html>
  );
}
