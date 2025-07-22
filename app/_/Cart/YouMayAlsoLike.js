import React, { Component } from "react";
import Slider from "react-slick";
import { store } from "../productsStore/Store";
import { Link } from "react-router-dom";
import Image from "next/image"

export default class AutoPlayMethods extends Component {
    constructor(props) {
        super(props);
        this.play = this.play.bind(this);
        this.pause = this.pause.bind(this);
        
    }
    play() {
        this.slider.slickPlay();
    }
    pause() {
        this.slider.slickPause();
    }
    render() {
        const settings = {
            dots: false,
            infinite: true,
            slidesToShow: 6,
            slidesToScroll: 1,
            autoplay: true,
            autoplaySpeed: 1500,
            arrows: false,
            responsive: [
                {
                    breakpoint: 991,
                    settings: {
                        slidesToShow: 3,
                    }
                },
                {
                    breakpoint: 767,
                    settings: {
                        slidesToShow: 2,
                    }
                }
            ]
        }
        , myLoader = ({ src, width, quality }) => {
            return `${src}?w=${width}&q=${quality || 75}`
        }


        return (
            <div className="youMay">
                <Slider ref={slider => (this.slider = slider)} {...settings}>
                    {store.map((item) => {
                        if (item.type == "ourBestSellers") {
                            return (<div key={item.id}>
                                <Link to={`/${item.id}`}>
                                    <Image
                                        loader={myLoader}
                                        src={item.primaryImage}
                                        alt={""}
                                        className=" w-48 spCaroImg brForMobile rounded-xl  mb-8"
                                        width={200}                                    height={200}
                                    />
                                </Link>
                            </div>)
                        }
                    })}
                </Slider>

            </div>
        );
    }
}



