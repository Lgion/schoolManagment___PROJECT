import { useContext } from "react";
import Image from "next/image"
import Slider from "react-slick";
import AuthContext from "../../stores/authContext.js"

export default function PresentationBolobi({carousel, carouselName}) {
    let it

  console.log("ok")
    
    return <section className="bolobiSliders">
            <Slider  >
                {carousel.map((value) =>{
                    for(it in value){
                        value = value[it].map((elt,i) => <section key={carouselName+""+i}>
                            <h1>{elt.h1}</h1>
                            <Image
                                // loader={myLoader}
                                src={`/img/_/${it}/${elt.src}`}
                                alt={" "}
                                width={200} height={500}
                            />
                            <p>{elt.p}</p>
                            {/* <h1>DIAPORAMA EXPLOITATION AGRICOLTE (POIVRE, CACAO, AUTRES)</h1> */}
                        </section>)
                    }
                    return value
                })}
            </Slider>
    </section>
}
