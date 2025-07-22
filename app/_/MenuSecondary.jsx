// import React from 'react'
import Link from "next/link";

export default function MenuSecondary() {
    return <ul id="menu2">
        {
            [
                {id:"demandes",title:"Nous intervenons pour vous sur plusieurs plans spirituelle, faite-y une demande chrétienne.",content:"Demande Chrétienne ?"},
                {id:"partenaires",title:"Découvrez ceux qui compte pour nous en Côte d'ivoire",content:"Partenaires",ul:[]},
                {id:"blog",title:"Suivez nos actualités sur notre blog, ou suivez nos actualités en flux RSS",content:"Blog et Flux RSS"},
                {id:"visite_guidee",title:"Découvrez tout sur la Puissance Divine en images et multimédias",content:"Visite guidée"},
                {id:"livredor",title:"Venez écrire un mot dans le livre d'or SVP",content:"Livre d or"},
                {id:"contacts",title:"Envoyer une un mail, une question ou autre",content:"Nos Contacts",ul:["email","puissancedamour@gmail.com","téléphone","09-36-06-72","etc","..."]},
            ].map((item,i)=><li id="demandes" key={"m2nd___"+i}>
                <Link
                    href={"#"+item.id}
                    title={item.title}
                    onClick={()=>{alert('oifdjoifdsjfdsij')}}
                    key={"demandes"+i}
                >
                        {item.content}
                        {/*item?.ul && <ul>
                            {item.ul.map((item___,j) => <li key={"m2ndbis___j"}>
                                <a href="" rel="noreferrer" target="_blank">
                                    void
                                </a>
                            </li>)}
                        </ul>*/}
                </Link>
            </li>)
        }
        {/*
            <li id="contacts">
                <a href="#contacts">Nos Contacts</a>
                <ul>
                    <li>email</li>
                    <li>puissancedamour@gmail.com</li>
                    <li>téléphone</li>
                    <li>09-36-06-72</li>
                    <li>etc</li>
                    <li>...</li>
                </ul>
            </li>
        */}
    </ul>
}
