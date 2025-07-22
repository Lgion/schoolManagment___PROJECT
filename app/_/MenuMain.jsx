import {useState, useContext, useEffect} from 'react'
import Link from "next/link";
import AuthContext from "../../stores/authContext.js"
import { usePathname } from 'next/navigation';

export default function MenuMain() {

    const {isAdmin, cartBox, isCartPage, mainmenu, menuActive, setMenuActive} = useContext(AuthContext)
    const pathname = usePathname();
    const icons = mainmenu.map(item => item.icon);
    
    return <>
        <menu className="mainMenu">
            {isAdmin &&<li className='admin_menu'>
                <Link id="admin_menu_link" href="/admin">ADMIN</Link>
            </li>}
            
            {/* {isAdmin && <menu className="admin">
                <li><Link href="/admin/school">ÉCOLE</Link></li>   
            </menu>} */}
            {
                mainmenu.map((item,i) => item.id!="blog-bolobi" && <li className={"menu "+item.id} key={"m1st___"+i}>
                    <Link
                        href={item.href}
                        title={item.title}
                        id={item.id+"_menu"}
                        className={item.icon+" "+(item.id=="accueil"?"homeLink ":"")+(menuActive==item.id?"active":"")}
                        onClick={()=>{
                            setMenuActive(item.id)
                            // setMainMenuObject(item.h2)
                        }}
                        dangerouslySetInnerHTML={{__html: item.content}}
                    >
                    </Link>
                </li>
                )
            }
            {(pathname?.startsWith('/blog') || pathname?.startsWith('/posts')) && (
                <li className="menu blog">
                    <Link id="blog_menu" className="active" href="/blog">
                        <span>Blog</span>
                    </Link>
                </li>
            )}
        </menu>
    </>
}
