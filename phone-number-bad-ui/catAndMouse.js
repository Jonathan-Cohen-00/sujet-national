const openBtn = document.getElementById('game-launch-button');
openBtn.addEventListener('click', openModal);

const host = document.getElementById('game-modal');
let lastTileId = null;

let backdrop = null;

function createModalContent() {
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.tabIndex = -1; // pour capter le focus si nécessaire
    backdrop.setAttribute('role','dialog');
    backdrop.setAttribute('aria-modal','true');

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role','document');

    modal.innerHTML =
        `
        <header class="at-right">
          <button class="close-btn" aria-label="Fermer la modale">&times;</button>
        </header>
        <div id="game-container">
            <div class="tile-container">
                <div class="tile" data-id="1">1</div>
            </div>
            <div class="tile-container">
                <div class="tile" data-id="2">2</div>
            </div>
            <div class="tile-container">
                <div class="tile" data-id="3">3</div>
            </div>
            <div class="tile-container">
                <div class="tile" data-id="4">4</div>
            </div>
            <div class="tile-container">
                <div class="tile" data-id="5">5</div>
            </div>
            <div class="tile-container">
                <div class="tile" data-id="6">6</div>
            </div>
            <div class="tile-container">
                <div class="tile" data-id="7">7</div>
            </div>
            <div class="tile-container">
                <div class="tile" data-id="8">8</div>
            </div>
            <div class="tile-container" >
                <div class="tile" data-id="9">9</div>
            </div>
            <div class="tile-container">
                <div class="tile" data-id="X">X</div>
            </div>
            <div class="tile-container">
                <div class="tile" data-id="0">0</div>
            </div>
            <div class="tile-container">
                <div class="tile" data-id="V">V</div>
            </div>
            
            <img id="cat" src="images/mad_windows.png">
        </div>
        <div id="phone-number-field"></div>
      `;

    backdrop.appendChild(modal);
    return { backdrop, modal };
}

// Gestion du focus trap simple : récupère les éléments focusables
function getFocusable(root) {
    const selectors = [
        'a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])',
        'textarea:not([disabled])', 'button:not([disabled])', '[tabindex]:not([tabindex="-1"])'
    ];
    return Array.from(root.querySelectorAll(selectors.join(','))).filter(el => el.offsetParent !== null);
}

let previousActive = null;
let cleanup = null;

function openModal() {
    // Ne pas ouvrir si déjà ouverte
    if (host.querySelector('.modal-backdrop')) return;

    previousActive = document.activeElement;

    const { backdrop, modal } = createModalContent();
    host.appendChild(backdrop);

    // Bloquer le scroll du body
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // For accessibility: signaler que le reste du document est inactif
    document.querySelectorAll('body > *:not(#game-modal)').forEach(el => {
        if (el !== host) el.setAttribute('aria-hidden','true');
    });

    // Focus sur le premier élément focusable dentro la modale
    const focusables = getFocusable(modal);
    if (focusables.length) focusables[0].focus();
    else modal.focus();

    // Fermeture par le bouton close
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', closeModal);

    // Fermeture si clique sur le backdrop (hors modal)
    backdrop.addEventListener('click', (ev) => {
        if (ev.target === backdrop) closeModal();
    });

    // Cleanup function pour fermer proprement
    cleanup = () => {
        document.body.style.overflow = prevOverflow;

        document.querySelectorAll('body > *:not(#game-modal)').forEach(el => {
            if (el !== host) el.removeAttribute('aria-hidden');
        });

        if (backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
        }
        if (previousActive && typeof previousActive.focus === 'function') {
            previousActive.focus();
        }
        cleanup = null;
    };

    gameLoop();
}

function closeModal() {
    if (typeof cleanup === 'function') cleanup();
}

function getTileAtCatPosition() {
    const cat = document.getElementById("cat");
    const board = document.getElementById("game-container");

    const catRect = cat.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    const centerX = catRect.left + catRect.width / 2;
    const centerY = catRect.top + catRect.height / 2;

    const tileContainers = document.querySelectorAll(".tile");

    for (const tile of tileContainers) {
        const r = tile.getBoundingClientRect();
        if (
            centerX >= r.left &&
            centerX <= r.right &&
            centerY >= r.top &&
            centerY <= r.bottom
        ) {
            return tile.dataset.id;
        }
    }
    return null;
}

function gameLoop() {
    const cat = document.getElementById("cat");
    const board = document.getElementById("game-container");

    let catX = 100;
    let catY = 100;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    document.addEventListener("mousemove", (e) => {
        
        const rect = board.getBoundingClientRect();

        // Coordonnées du curseur dans le repère du plateau
        mouseX = e.clientX - rect.left - 20;
        mouseY = e.clientY - rect.top - 20;
    });

    let speed = 300; // Pixels / Sec

    requestAnimationFrame(updateCatPosition);

    function updateCatPosition() {
        // Calcul direction
        const dx = mouseX - catX;
        const dy = mouseY - catY;
        const distance = Math.sqrt(dx * dx + dy * dy);


        if (distance > 1) {
            const vx = (dx / distance) * (speed / 60);
            const vy = (dy / distance) * (speed / 60);
            catX += vx;
            catY += vy;
        }
        else {
            catGotYou();
            return;
        }
 
         // Dimensions relatives
         const maxX = board.offsetWidth - cat.offsetWidth;
         const maxY = board.offsetHeight - cat.offsetHeight;
 
         // Empêche de sortir du plateau
         catX = Math.max(0, Math.min(catX, maxX));
         catY = Math.max(0, Math.min(catY, maxY));

        // Applique la position
        cat.style.transform = `translate(${catX}px, ${catY}px)`;

        //  Boucle gameplay : détecte la tuile actuelle
        const currentTile = getTileAtCatPosition();

        if (currentTile !== null && currentTile !== lastTileId) {
            // On entre dans une NOUVELLE tuile → on ajoute
            onNewTile(currentTile);
        }
        lastTileId = currentTile;

        requestAnimationFrame(updateCatPosition);
    }

    let currentColor = 0;

    function onNewTile(value) {
        const field = document.getElementById("phone-number-field");

        const modal = document.querySelector('.modal');

        const colors = [
            "rgb(245, 233, 230)",
            "rgb(250, 217, 211)",
            "rgb(235, 200, 200)",
            "rgb(230, 180, 180)",
            "rgb(225, 160, 150)",
            "rgb(220, 150, 140)",
            "rgb(210, 140, 130)",
            "rgb(200, 120, 120)",
            "rgb(241,110,100)"]

        if (value === "X") {
            field.textContent = "";
            speed = 300;
            modal.style.backgroundColor = "white";
            currentColor = 0;
        }
        else if (value === "V") {
            modal.style.backgroundColor = "white";
            currentColor = 0;

            const phoneField = document.getElementById("phone-number-input-field");
            if (field.textContent.length !== 10) {
                invalidPhoneNumber();
            }
            else {
                validPhoneNumber(phoneField, field.textContent);
            }
        }
        else {
            if (field.textContent.length < 10) {
                field.textContent += value;
                speed += 20;
                modal.style.backgroundColor = colors[currentColor++];
            }
        }
    }

    function catGotYou() {
        backdrop.innerHTML = '';

        const subbackdrop = document.createElement('div');
        subbackdrop.className = 'modal-backdrop';
        subbackdrop.setAttribute('role','dialog');
        subbackdrop.setAttribute('aria-modal','true');

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.setAttribute('role','document');

        modal.innerHTML =
            `
        <div class="center-column">
            <h1>Windows vous a rattrapé!</h1>
            
            <img src="images/bill_gates.png" style="width: 70%; height: 70%;">
            <p>Vous avez mis à jour votre système vers Windows 11. 
            Bill Gates continue à s'enrichir!
            </p>
            
            <button id="retry">Retry</button>
        </div>
        `;

        subbackdrop.appendChild(modal);

        backdrop.appendChild(subbackdrop);

        const retryButton = document.getElementById('retry');
        retryButton.addEventListener('click', e => {
            host.innerHTML = '';
            openModal();
        });
    }

    function invalidPhoneNumber() {
        backdrop.innerHTML = '';

        const subbackdrop = document.createElement('div');
        subbackdrop.className = 'modal-backdrop';
        subbackdrop.setAttribute('role','dialog');
        subbackdrop.setAttribute('aria-modal','true');

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.setAttribute('role','document');

        modal.innerHTML =
            `
        <div class="center-column">
            <h1>Numéro de téléphone invalide!</h1>
            
            <img src="images/sad_tux.png" style="width: 70%; height: 70%;">
            <p>Tux n'a pas réussi à accomplir sa mission...</p>
            
            <button id="retry">Retry</button>
        </div>
        `;

        subbackdrop.appendChild(modal);70

        backdrop.appendChild(subbackdrop);

        const retryButton = document.getElementById('retry');
        retryButton.addEventListener('click', e => {
            host.innerHTML = '';
            openModal();
        });
    }



    function validPhoneNumber(whereToWrite, whatToWrite) {
        backdrop.innerHTML = '';

        const subbackdrop = document.createElement('div');
        subbackdrop.className = 'modal-backdrop';
        subbackdrop.setAttribute('role','dialog');
        subbackdrop.setAttribute('aria-modal','true');

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.setAttribute('role','document');

        modal.innerHTML =
            `
        <div class="center-column space-between">
            <h1>Félicitations!</h1>
            
            <img src="images/happy_tux.png" style="width: 60%; height: 60%;">
            
            <div class="center-column">
                <p>Vous avez entré un numéro de téléphone valide ! Tux a réussi sa mission !</p>
                <p id="entered-phone-number">Est ce bien votre numéro ?</p>
                <div class="buttons">
                    <button id="confirm">Confirm</button>
                    <button id="retry">Retry</button>
                </div>
            </div>
            
        </div>
        `;

        subbackdrop.appendChild(modal);

        backdrop.appendChild(subbackdrop);

        const displayEnteredPhoneNumber = document.getElementById('entered-phone-number');
        displayEnteredPhoneNumber.innerText += ("   " + whatToWrite);

        const retryButton = document.getElementById('retry');
        retryButton.addEventListener('click', e => {
            host.innerHTML = '';
            openModal();
        });

        const confirmButton = document.getElementById('confirm');
        confirmButton.addEventListener('click', e => {
            whereToWrite.value = whatToWrite;
            closeModal();
        })
    }
}







