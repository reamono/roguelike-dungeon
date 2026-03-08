export const TILE_SIZE = 32
export const MAP_WIDTH = 40
export const MAP_HEIGHT = 30

export const TILE = {
  WALL: 0,
  FLOOR: 1,
  CORRIDOR: 2,
  STAIRS: 3,
}

export const COLORS = {
  [TILE.WALL]: '#1a1a2e',
  [TILE.FLOOR]: '#2a2a4a',
  [TILE.CORRIDOR]: '#222244',
  [TILE.STAIRS]: '#44aa66',
  WALL_EDGE: '#2a2a4e',
  PLAYER: '#ffcc44',
  PLAYER_OUTLINE: '#cc9900',
  FOG: '#0a0a1a',
  UNEXPLORED: '#000000',
}
