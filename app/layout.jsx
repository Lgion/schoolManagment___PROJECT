import "./index.scss"
import Home from "./Home"

import {AdminContextProvider} from '../stores/ai_adminContext';

export default function EcoleAdminLayout({ children }) {

  return (
    <AdminContextProvider>
      <Home>
        {children}
      </Home>
    </AdminContextProvider>
  );
}
