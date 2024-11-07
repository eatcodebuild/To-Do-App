
function changeText(elementId, arrowId) {
    const element = document.getElementById(elementId);
    const arrow = document.getElementById(arrowId);
    
    element.innerHTML = 'See what the fuss is about...';
    arrow.classList.add('arrowAnimate');
    
}

function changeTextBack(elementId, arrowId) {
    const element = document.getElementById(elementId);
    const arrow = document.getElementById(arrowId);
    
    element.innerHTML = 'Find out more';
    arrow.classList.remove('arrowAnimate');

}


