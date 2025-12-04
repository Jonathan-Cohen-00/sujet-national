const openBtn = document.getElementById('game-launch-button');
const host = document.getElementById('game-modal');

let lastTileId = null;

function createModalContent() {
    const backdrop = document.createElement('div');
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
            <div class="tile-container" data-id="1">
                <div class="tile">1</div>
            </div>
            <div class="tile-container" data-id="2">
                <div class="tile">2</div>
            </div>
            <div class="tile-container" data-id="3">
                <div class="tile">3</div>
            </div>
            <div class="tile-container" data-id="4">
                <div class="tile">4</div>
            </div>
            <div class="tile-container" data-id="5">
                <div class="tile">5</div>
            </div>
            <div class="tile-container" data-id="6">
                <div class="tile">6</div>
            </div>
            <div class="tile-container" data-id="7">
                <div class="tile">7</div>
            </div>
            <div class="tile-container" data-id="8">
                <div class="tile">8</div>
            </div>
            <div class="tile-container" data-id="9">
                <div class="tile">9</div>
            </div>
            <div class="tile-container" data-id="X">
                <div class="tile">X</div>
            </div>
            <div class="tile-container" data-id="0">
                <div class="tile">0</div>
            </div>
            <div class="tile-container" data-id="V">
                <div class="tile">V</div>
            </div>
            
            <div id="cat"></div>
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

    // Gestion clavier (Esc pour fermer, Tab pour focus trap)
    function onKeyDown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeModal();
            return;
        }
        if (e.key === 'Tab') {
            const focusables = getFocusable(modal);
            if (!focusables.length) { e.preventDefault(); return; }
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    }
    document.addEventListener('keydown', onKeyDown);

    // Cleanup function pour fermer proprement
    cleanup = () => {
        // restaurer overflow
        document.body.style.overflow = prevOverflow;
        // enlever aria-hidden du reste
        document.querySelectorAll('body > *:not(#game-modal)').forEach(el => {
            if (el !== host) el.removeAttribute('aria-hidden');
        });
        // retirer l'élément
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        // restaurer focus
        if (previousActive && typeof previousActive.focus === 'function') previousActive.focus();
        // enlever le listener clavier
        document.removeEventListener('keydown', onKeyDown);
        cleanup = null;
    };


    document.addEventListener('keydown', getTileAtCatPosition);

    beginGame();
}

function closeModal() {
    if (typeof cleanup === 'function') cleanup();
}

openBtn.addEventListener('click', openModal);

// Exposition optionnelle pour dev console (non nécessaire)
window.__openModal = openModal;
window.__closeModal = closeModal;


function getTileAtCatPosition() {
    const cat = document.getElementById("cat");
    const board = document.getElementById("game-container");

    const catRect = cat.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    const centerX = catRect.left + catRect.width / 2;
    const centerY = catRect.top + catRect.height / 2;

    const tileContainers = document.querySelectorAll(".tile-container");

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

function beginGame() {
    const cat = document.getElementById("cat");
    const board = document.getElementById("game-container");

    let catX = 100;    // position actuelle
    let catY = 100;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;



    document.addEventListener("mousemove", (e) => {
        
        const rect = board.getBoundingClientRect();

        // Coordonnées du curseur dans le repère du plateau
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });


    const speed = 250; // vitesse en pixels/s (modifiable)

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

         // RÉCUPÉRATION DES LIMITES
         const boardRect = board.getBoundingClientRect();
         const catRect = cat.getBoundingClientRect();
 
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
            addTileToPhoneNumber(currentTile);
            lastTileId = currentTile;
        }

        requestAnimationFrame(updateCatPosition);
    }

    function addTileToPhoneNumber(value) {
        const field = document.getElementById("phone-number-field");

        if (value === "X") {
            field.textContent = "";

        }
        else if (value === "V") {
            const phoneField = document.getElementById("phone-number-input-field");
            phoneField.value = field.textContent; 
            closeModal(); 
        }
        else{
            if (field.textContent.length < 10) {
                field.textContent += value;
            }
        }
        
        
        

    }


// démarre la boucle
}





