// scripts/map_data.js

// Définir des régions de la carte en une seule zone terrestre
const mapRegions = [
    // Toute la carte est de type "land"
    { x1: 0, y1: 0, x2: 8192, y2: 4096, type: "land" }
];

// Fonction simplifiée pour la détection de terrain
function getTerrainType(x, y, width, height) {
    // Tout est considéré comme terrain normal
    return "land";
}

// Fonction simplifiée pour obtenir des emplacements aléatoires
function getRandomSafeLocation(width, height) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    return { x, y, terrain: "land" };
}

// Rendre les fonctions disponibles globalement
window.getTerrainType = getTerrainType;
window.getRandomSafeLocation = getRandomSafeLocation;