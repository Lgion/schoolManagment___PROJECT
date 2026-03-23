"use client"

import { useState, useEffect, useContext, useRef } from 'react'
import Link from "next/link";
import { SignInButton, SignUpButton, UserProfile, UserButton, isLoaded, useUser, SignedIn, SignedOut, useClerk } from "@clerk/nextjs"


import { getLSItem, setLSItem } from '../../utils/localStorageManager.js';

export default function LogSignIn() {
    const wasSignedIn = useRef(null); // Pour tracker la transition de déconnexion

    const [isCartPage, setIsCartPage] = useState()
        // , { isLoaded, userId, sessionId, getToken } = useAuth()
        , { isSignedIn, user } = useUser()
        , { signOut } = useClerk();

    useEffect(() => {
        // --- DETECTION LOGOUT ---
        // Si on était connecté et qu'on ne l'est plus, on force un nettoyage total pour retomber sur la Landing Page
        if (wasSignedIn.current === true && !isSignedIn) {
            console.log("🚩 Détection Déconnexion : Nettoyage cookies et redirection Landing Page");
            document.cookie = "is_landing_demo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "force_falsy=true; path=/; max-age=86400";
            
            // On retombe sur la page racine en ignorant l'historique clerk pour être sûr
            window.location.href = "/";
            return;
        }
        wasSignedIn.current = isSignedIn;

        console.log(user?.primaryEmailAddress?.emailAddress)
        if (!isSignedIn) {
            // L'utilisateur n'est PAS connecté. 
            // On ne touche PAS au cookie 'is_landing_demo' ici car c'est lui qui permet le mode Visiteur/Démo.
            // On se contente d'ajouter le cookie force_falsy pour isoler le cache.
            document.cookie = "force_falsy=true; path=/; max-age=86400";
        } else if (process.env.NEXT_PUBLIC_EMAIL_ADMIN.indexOf(user?.primaryEmailAddress?.emailAddress) !== -1) {
            // Utilisateur Connecté -> On tue la session démo de la Landing Page
            document.cookie = "is_landing_demo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            
            // Effacer le mode Falsy car c'est un compte Admin autorisé
            document.cookie = "force_falsy=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

            const prev_email = user?.primaryEmailAddress?.emailAddress.substring(0, user?.primaryEmailAddress?.emailAddress.indexOf("@"))
            let myRole = ""
            console.log(user?.primaryEmailAddress?.emailAddress);
            console.log(prev_email);

            switch (prev_email) {
                case "hi.cyril": case "legion.athenienne": myRole = "admin"
                    break;
                case "puissancedamour": myRole = "editeur"
                    break;
                case "prof": myRole = "enseignant"
                    break;
            }
            console.log(myRole);
        } else {
            // Utilisateur Connecté -> On tue la session démo de la Landing Page
            document.cookie = "is_landing_demo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

            // Utilisateur connecté MAIS n'est pas dans la liste des admins :
            // Le backend va le forcer en Falsy (cf. dbConnect.js).
            // On ajoute le cookie pour que le cache reste isolé.
            document.cookie = "force_falsy=true; path=/; max-age=86400";
        }

        // --- Ajout récupération/création user MongoDB et stockage localStorage ---
        const email = user?.primaryEmailAddress?.emailAddress;
        if (email && !getLSItem('user')) {
            fetch(`/api/users?email=${encodeURIComponent(email)}`)
                .then(async res => {
                    if (res.ok) {
                        const data = await res.json();
                        setLSItem('user', data.user);
                    } else if (res.status === 404) {
                        // Créer l'utilisateur si non trouvé
                        return fetch('/api/users', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email }),
                        })
                            .then(res => res.json())
                            .then(data => {
                                setLSItem('user', data.user);
                            });
                    }
                })
                .catch(err => {
                    console.error('Erreur lors de la récupération/creation du user:', err);
                });
        }
        // --- Fin ajout ---
    }, [user])


    useEffect(() => {

        //EASY DEV PURPOSE
        // setIsAdmin(true);



        (() => { setIsCartPage(document.querySelector('#__next>main.cart')) })()
        console.log("TRY TO USE CLERK NPM PACKAGE SOLUTION FOR LOGIN SERVICES")
        // alert("TRY TO USE CLERK NPM PACKAGE SOLUTION FOR LOGIN SERVICES")
    }, [])

    return <div id="log_and_sign_in" className={isSignedIn ? "connected" : ""}>
        {/* <Link href="sign-in">➕</Link> */}
        {/* <a href="#" onClick={()=>{getClass("inscription","see")}} title="Inscription">
            ➕
        </a> */}


        <SignedOut>
            <SignInButton title="Se conncecter/S'incrire">&nbsp;</SignInButton>
        </SignedOut>
        {/* <SignedOut>
            <SignInButton>➕</SignInButton>
            <SignUpButton>👤</SignUpButton>
        </SignedOut> */}

        <SignedIn>
            <UserButton afterSignOutUrl="/" />
            {/* <button onClick={() => signOut()} >
            out
            </button> */}
        </SignedIn>
        {/* <UserProfile /> */}


        {/* || 
         - {JSON.stringify(user)}
          - {isLoaded.toString()} - {userId} - {sessionId}
         ||  */}

        {/* <Link href="sign-up">👤</Link> */}
        {/* <a href="#" onClick={()=>{getClass("connexion","see")}} title="Connexion">
            👤
        </a> */}
        <form id="connexion" action="index.php?admin=ok" method="post">
            <input type="text" name="user" placeholder="nom utilisateur" />
            <input type="password" name="pwd" placeholder="**********" />
            <input
                style={{
                    padding: 0,
                    width: "95%",
                    height: "50px",
                    cursor: "pointer",
                    color: "goldenrod",
                    fontSize: "1em",
                }}
                type="submit"
                value="ok"
            />
        </form>
    </div>
}
