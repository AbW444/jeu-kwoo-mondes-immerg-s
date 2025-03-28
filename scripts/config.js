// scripts/config.js
const CONFIG = {
    BASE_PATH: '.',
    ASSETS_PATH: './assets',
    SPRITES_PATH: './assets/sprites',
    POKEMON_SPRITES_PATH: './assets/sprites/pokemon',
    MAPS_PATH: './assets/maps',
    BACKGROUND_PATH: './assets/background.jpg'
};

// Fonction utilitaire pour faciliter le chargement d'images
function loadImage(path) {
    const img = new Image();
    img.src = path;
    
    // Promesse pour s'assurer que l'image est bien chargée
    const loadPromise = new Promise((resolve) => {
        img.onload = () => {
            console.log(`Image chargée avec succès: ${path}`);
            resolve(true);
        };
        img.onerror = (e) => {
            console.error(`ERREUR: Impossible de charger l'image: ${path}`, e);
            resolve(false);
        };
    });
    
    return { image: img, loadPromise };
}