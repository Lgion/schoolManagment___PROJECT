import {useState,useEffect,useContext} from 'react'
import Link from "next/link";
import { SignInButton, SignUpButton, UserProfile, UserButton, useAuth, isLoaded, useUser, SignedIn, SignedOut, useClerk } from "@clerk/nextjs"

import AuthContext from "../../stores/authContext.js"

export default function LogSignIn() {

    const [isCartPage, setIsCartPage] = useState()
    , {setIsAdmin,role,setRole} = useContext(AuthContext)
    // , { isLoaded, userId, sessionId, getToken } = useAuth()
    , { isSignedIn, user } = useUser()
    , { signOut } = useClerk();

    useEffect(() => {
        console.log(user?.primaryEmailAddress?.emailAddress)
        if(!isSignedIn)
            setIsAdmin(false)
        if(process.env.NEXT_PUBLIC_EMAIL_ADMIN.indexOf(user?.primaryEmailAddress?.emailAddress) !== -1
        // if(user?.primaryEmailAddress?.emailAddress == "hi.cyril@gmail.com"
            // || true 
        ){
            const prev_email = user?.primaryEmailAddress?.emailAddress.substring(0,user?.primaryEmailAddress?.emailAddress.indexOf("@"))
            let myRole = ""
            console.log(user?.primaryEmailAddress?.emailAddress);
            console.log(prev_email);
            
            setIsAdmin(true)
            switch(prev_email){
                case"hi.cyril":case"legion.athenienne": myRole = "admin"
                break;
                case"puissancedamour": myRole = "editeur"
                break;
                case"prof": myRole = "enseignant"
                break;
            }
            console.log(myRole);
            console.log(role);
            setRole(myRole)
            console.log(role);
            
        }

        // --- Ajout récupération/création user MongoDB et stockage localStorage ---
        const email = user?.primaryEmailAddress?.emailAddress;
        if (email && !localStorage.getItem('user')) {
          fetch(`/api/users?email=${encodeURIComponent(email)}`)
            .then(async res => {
            alert(0)
              if (res.ok) {
                alert(1)
                const data = await res.json();
                alert(2)
                localStorage.setItem('user', JSON.stringify(data.user));
            } else if (res.status === 404) {
                  alert(11)
                // Créer l'utilisateur si non trouvé
                return fetch('/api/users', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
                })
                  .then(res => res.json())
                  .then(data => {
                    alert(22)
                    localStorage.setItem('user', JSON.stringify(data.user));
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


        
        (()=>{setIsCartPage(document.querySelector('#__next>main.cart'))})()
        console.log("TRY TO USE CLERK NPM PACKAGE SOLUTION FOR LOGIN SERVICES")
        // alert("TRY TO USE CLERK NPM PACKAGE SOLUTION FOR LOGIN SERVICES")
    },[])
    
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
            <UserButton afterSignOutUrl="/"/>
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
