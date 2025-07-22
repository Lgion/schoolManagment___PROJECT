export function loadRadios(){
    let currentValue = 1;
    const timeout = 0.75;
    const radios = document.querySelectorAll('.radioLabel input');
    const fakeRadios = document.querySelectorAll('.radioLabel span.radio');

    //This next bit kinda sucks and could be improved.
    //For simplicity, I'm assuming that the distance between the first and second radios is indicative of the distance between all radios. This will fail if one of the options goes onto two lines.
    //I should really move each radio independantly depending on its own distance to its neighbour. Oh well ¯\_(ツ)_/¯
    //TODO ^^^
    // const firstRadioY = document.querySelector('.fieldset label:nth-of-type(1) .radio').getBoundingClientRect().y;
    // const secondRadioY = document.querySelector('.fieldset label:nth-of-type(2) .radio').getBoundingClientRect().y;
    const firstRadioX = document.querySelector('fieldset label.radioLabel:nth-of-type(1) .radio').getBoundingClientRect().x;
    const secondRadioX = document.querySelector('fieldset label.radioLabel:nth-of-type(2) .radio').getBoundingClientRect().x;
    const indicitiveDistance = secondRadioX - firstRadioX;
    //End suckyness :D

    //Apply CSS delays in JS, so that if JS doesn't load, it doesn't delay selected radio colour change
    //I'm applying background style delay here so that it doesn't appear slow if JS is disabled/broken
    console.log(fakeRadios)
    fakeRadios.forEach(function(radio) {
        console.log(radio);
    radio.style.cssText = `transition: background 0s ${timeout}s;`;
    });
    //Have to do this bit the long way (i.e. with a <style> element) becuase you can't do inline pseudo element syles
    const css = `.radio::after {transition: opacity 0s ${timeout}s;}`

    // const head = document.head;
    // const style = document.createElement('style');
    // style.type = 'text/css';
    // style.appendChild(document.createTextNode(css));
    // head.appendChild(style);
    appendStyles(css)
    //End no-js animation fallbacks.

    radios.forEach(function(radio, i) {
    //Add an attr to make finding and styling the correct element a lot easier
    radio.parentElement.setAttribute('data-index', i + 1);
    
    //The meat: set up the change listener!
    radio.addEventListener('change', function() {
        //Stop weirdness of incomplete animation occuring. disable radios until complete.
        temporarilyDisable();

        //remove old style tag
        removeStyles();
        const nextValue = this.parentElement.dataset.index;

        const oldRadio = document.querySelector(`[data-index="${currentValue}"] .radio`);
        const newRadio = this.nextElementSibling;
        const oldRect = oldRadio.getBoundingClientRect();
        const newRect = newRadio.getBoundingClientRect();

        //Pixel distance between previous and newly-selected radios
        const yDiff = Math.abs(oldRect.x - newRect.x);
        
        //Direction. Is the new option higher or lower than the old option?
        const dirDown = oldRect.x - newRect.x > 0 ? true : false;
        
        //Figure out which unselected radios actually need to move 
        //(we don't necessarily want to move them all)
        const othersToMove = [];
        const lowEnd = Math.min(currentValue, nextValue);
        const highEnd = Math.max(currentValue, nextValue);

        const inBetweenies = range(lowEnd, highEnd, dirDown);
        let othersCss = '';
        inBetweenies.map(option => {
        //If there's more than one, add a subtle stagger effect
        const staggerDelay = inBetweenies.length > 1 ? 0.1 / inBetweenies.length * option : 0;
        othersCss += `
            [data-index="${option}"] .radio {
            animation: moveOthers ${timeout - staggerDelay}s ${staggerDelay}s;
            }
        `;
        });
        
        const css = `
        ${othersCss}
        [data-index="${currentValue}"] .radio { 
            animation: moveIt ${timeout}s; 
        }
        @keyframes moveIt {
            0% { transform: translateY(0); }
            33% { transform: translateY(-3rem) translateX(0); }
            66% { transform: translateY(-3rem) translateX(${dirDown ? '-' : ''}${yDiff}px); }
            100% { transform: translateY(0) translateX(${dirDown ? '-' : ''}${yDiff}px); }
        }
        @keyframes moveOthers {
            0% { transform: translateX(0); }
            33% { transform: translateX(0); }
            66% { transform: translateX(${dirDown ? '' : '-'}${indicitiveDistance}px); }
            100% { transform: translateX(${dirDown ? '' : '-'}${indicitiveDistance}px); }
        }
    `;
        appendStyles(css, "swappy-radio-styles");
        currentValue = nextValue;
    });
    });

    function appendStyles(css, id) {
    const head = document.head;
    const style = document.createElement('style');
    style.type = 'text/css';
    if(typeof id != "undefined")
        style.id = id; 
    style.appendChild(document.createTextNode(css));
    head.appendChild(style);
    }
    function removeStyles() {
    const node = document.getElementById('swappy-radio-styles');
    if (node && node.parentNode) {
        node.parentNode.removeChild(node);
    }
    }
    function range(start, end, dirDown) {
    let extra = 1;
    if (dirDown) {
        extra = 0;
    }
    return [...Array(end - start).keys()].map(v => start + v + extra);
    }
    function temporarilyDisable() {
        radios.forEach((item) => {
        item.setAttribute('disabled', true);
        setTimeout(() => { 
            item.removeAttribute('disabled');
        }, timeout * 1000);
        });
    }
}