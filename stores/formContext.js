"use client"

import {createContext, useEffect, useState, useMemo} from 'react'
import styled,{createGlobalStyle} from 'styled-components'

const FormContext = createContext({
    // ok: null,
    // cartBox: null,
    // setCartBox: null,
})
export default FormContext

export const FormContextProvider = ({children}) => {


    let [FieldsetRadioStyled, setFieldsetRadioStyled] = useState("fieldset")
    , [SectionCheckboxStyled, setSectionCheckboxStyled] = useState("section")
    , [formNdrToggleImg, setFormNdrToggleImg] = useState("section")
    , toggleFormNdrImg = () => {
        setFormNdrToggleImg(!formNdrToggleImg)
    }
    , templateScss = {
        colors: {
        "$void_gray":"#c9ded6",
        "$primary":"#9356DC",
        // $secondary:#1397EB;
        "$secondary":"#1F4EEA",
        "$secondary_1":"#2989d8",
        "$secondary_2":"#a1e1f480",
        "$ternary":"goldenrod",
        "$ternary_1":"#EBE813",
        "$ternary_2":"#96943E",
        "$fourth":"#cc0000",
        "$fourth_1":"#ff59004d",
        }
    }
    , dateDiff = (date1, date2) => {
        var diff = {}							// Initialisation du retour
        var tmp = date2 - date1;
      
        tmp = Math.floor(tmp/1000);             // Nombre de secondes entre les 2 dates
        diff.sec = tmp % 60;					// Extraction du nombre de secondes
      
        tmp = Math.floor((tmp-diff.sec)/60);	// Nombre de minutes (partie entière)
        diff.min = tmp % 60;					// Extraction du nombre de minutes
      
        tmp = Math.floor((tmp-diff.min)/60);	// Nombre d'heures (entières)
        diff.hour = tmp % 24;					// Extraction du nombre d'heures
        
        tmp = Math.floor((tmp-diff.hour)/24);	// Nombre de jours restants
        diff.day = tmp;
        
        return diff;
      }

    useEffect(() => { 
        console.log(FieldsetRadioStyled);
    }, [])
    useEffect(() => { 
        setFieldsetRadioStyled(styled.fieldset`
            display: flex;
            flex-flow: wrap;
            >label{
                width:100%;
            }
            >section{
                width: 100%;
                display: flex;
                padding-top:1em;
            }
            label.radioLabel{
                display: block;
                flex:1 1 30%;
                position: relative;
                // padding-left: 4rem;
                padding: 1em 0 0.25em;
                margin: 1.5rem 0 1.5em;
                text-align:center;
                cursor: pointer;
                font-size: 2rem;
                user-select: none;
                color: #555;
                line-height: .75em;
                >section{
                    text-align: center;
                }
                &:hover>input~span.radio{
                    //using opacity for hover effect, because background is used (amd delayed!) for the shuffle
                    // opacity: 0.8;
                }
                input:not(#location_dortoir_readlony){
                    position: absolute;
                    opacity: 0;
                    cursor: pointer;
                    height: 0;
                    width: 0;
                    &:checked {
                        ~span{
                            color: ${templateScss.colors.$ternary};
                            transition: color .5s;
                            opacity:1;
                            text-shadow: 0 0 3px BLACK;
                            &.radio {
                                background-color: ${templateScss.colors.$secondary};
                                opacity: 1!important;
                                &::after {
                                    opacity: 1;
                                    //applying in JS, so as not to make selections delayed when no js:
                                    // transition: opacity 0s 0.75s;
                                }
                            }
                        }
                        ~input#individual_room_participants{
                            opacity:1;
                            padding:0 .5em;
                            height:1em;
                            width:2em;
                        }
                    }
                }
                // &:has(input#individual_room_participants):has(input:checked){
                //     &::after{
                //         content:"personnes";
                //         position:absolute;
                //         bottom:-1em;
                //         right:0;
                //         // width:100px;
                //         // height:100px;
                //     }
                // }
                >span{
                    &.radio {
                        position: absolute;
                        top: -.5em;
                        left: calc(50% - 1.25rem);
                        height: 2.5rem;
                        width: 2.5rem;
                        border-radius: 50%;
                        &::after {
                            display: block;
                            content: '';
                            position: absolute;
                            opacity: 0;
                            top: .5rem;
                            left: .5rem;
                            width: 25px;
                            height: 25px;
                            border-radius: 50%;
                            background: #fff;
                            //applying in JS, so as not to make selections delayed when no js:
                            // transition: opacity 0s 0.75s;
                        }
                    }
                    >b{
                      display: block;
                      font-size: .5em;
                    }
                }
            }
        `)
        setSectionCheckboxStyled(styled.section`
            
            display:unset !important;
            height: 85px;
            width: 100% !important;
            overflow: hidden;
            border-radius: 3px;
            cursor: pointer;
            >label{
                background: #384c60;
                cursor: pointer;
                input{
                    opacity: 0;
                    position: absolute;
                    left: -10000px;
                    &:checked{
                        +span{
                            margin-left: 0;
                        }
                        ~.indicator{
                            .circ{
                            stroke: #557D25;
                            opacity: 1;
                            }
                            .tick{
                            opacity: 1;
                            stroke-dashoffset: 0;
                            transition-delay: 0.5s;  
                            }
                            .cross{
                            opacity: 0;
                            transition: stroke-dashoffset 0.5s ease, opacity 0.5s ease;
                            transition-delay: 0;
                            stroke-dashoffset: 15;
                            }
                        }
                    }
                }
                >span{
                    float: left;
                    color: #fff;
                    font-family: Arial;
                    font-weight: bold;
                    text-align: center;
                    width: 70%;
                    height: 100%;
                    background: #0380b3;
                    display: block;
                    font-size: 14px;
                    line-height: 50px;
                    -webkit-transition: margin 0.2s linear;
                    -moz-transition: margin 0.2s linear;
                    -ms-transition: margin 0.2s linear;
                    -o-transition: margin 0.2s linear;
                    transition: margin 0.2s linear;
                    margin-left: -70%;
                    &:first-of-type{
                        line-height: 1.75em;
                        font-size: 1.5em;
                    }
                    ~span{
                        margin-left: 0;
                        background: none;
                        font-size: 1.5em;
                    }
                }
                >i.indicator{
                    float: left;
                    background: #ccc;
                    height: 100%;
                    width: 30%;
                    padding: 8px;
                    box-sizing: border-box;
                    >svg{
                    >path{
                        &.circ{
                        stroke:#CD4C10;
                        transition: stroke 1s 0.2s;
                        }
                    }
                    >polyline{
                        &.tick{
                        stroke-dasharray: 20;
                        stroke-dashoffset: 20;
                        transition: stroke-dashoffset 0.3s;
                        transition-delay: 0s;
                        }
                        &.cross{
                        /* opacity: 1; */
                        stroke-dasharray: 15;
                        stroke-dashoffset: 0;
                        transition: stroke-dashoffset 0.25s ease-in;
                        transition-delay: 0.5s;
                        +.cross{
                            transition-delay: 0.25s;
                        }
                        }
                    }
                    }
                }
            }
        `)
    }, [])
    const context = {SectionCheckboxStyled, FieldsetRadioStyled, dateDiff, formNdrToggleImg, toggleFormNdrImg}
    
    return (
        <FormContext.Provider value={context}>
            {children}
        </FormContext.Provider>
    )
}


