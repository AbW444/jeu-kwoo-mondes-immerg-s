const mapRegions = [
  { x1: 0, y1: 0, x2: 8192, y2: 4096, type: "land" }
];

function getTerrainType(x, y, width, height) {
  return "land";
}

function getRandomSafeLocation(width, height) {
  const x = Math.random() * width;
  const y = Math.random() * height;
  return { x, y, terrain: "land" };
}

window.getTerrainType = getTerrainType;
window.getRandomSafeLocation = getRandomSafeLocation;
