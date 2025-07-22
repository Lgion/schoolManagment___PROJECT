import React from 'react'
import { FaShoppingBag } from "react-icons/fa";
import logo from "../assets/cara.png";
import "../styles/Navbar.css";
import { Link } from 'react-router-dom';
import { useState } from 'react';

import Image from "next/image"

const MobileNav = () => {

    const myLoader = ({ src, width, quality }) => {
        return `${src}?w=${width}&q=${quality || 75}`
    }
    return (
        <div className='mobNavMainPrant '>

            <div className="navbar">
                <div className='flex gap-40'>

                    <Link to="/">
                    <Image
                        loader={myLoader}
                        src={logo}
                        alt={""}
                        className=" w-32"
                        width={200}                                    height={200}
                    />
                    </Link>

                    <Link to={"/cart"}>
                        <FaShoppingBag className=' text-xl' />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default MobileNav