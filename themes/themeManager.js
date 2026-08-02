window.ThemeManager = {
  themes: {
    none: {
      id: 'none',
      name: 'None',
      description: '標準表示',

      glsl: {
        enabled: false,
        shader: 'none'
      },

      particles: {
        preset: 'default',
        enabled: true
      },

      godRay: {
        enabled: false
      },

      spectrum: {
        color: 'default'
      }
    },

    bubbleOcean: {
      id: 'bubbleOcean',
      name: 'Bubble Ocean',
      description: '海・泡・水中光',

      glsl: {
  enabled: false,
  shader: 'none'
},

      particles: {
        preset: 'bubble',
        enabled: true
      },

      godRay: {
        enabled: true
      },

      spectrum: {
        color: 'ocean'
      }
    },

    deepGalaxy: {
      id: 'deepGalaxy',
      name: 'Deep Galaxy',
      description: '銀河・星雲・星',

      glsl: {
        enabled: true,
        shader: 'deepGalaxy'
      },

      particles: {
        preset: 'starDust',
        enabled: true
      },

      godRay: {
        enabled: false
      },

      spectrum: {
        color: 'galaxy'
      }
    },

    aurora: {
  id: 'aurora',
  name: 'Aurora',
  description: '光の波・オーロラ',

  glsl: {
    enabled: false,
    shader: "none"
},

  particles: {
    preset: 'auroraDust',
    enabled: true
  },

  godRay: {
    enabled: false
  },

  spectrum: {
    color: 'aurora'
  },
  background: {
  type: "image",
  src: "./themes/aurora/aurora-bg.png",
  opacity: 1
}

},


neonGeometry: {
  id: 'neonGeometry',
  name: 'Neon Geometry',
  description: '幾何学ネオン・オーディオリアクティブ',

  glsl: {
    enabled: true,
    shader: 'neonGeometry'
  },

  particles: {
    preset: 'default',
    enabled: false
  },

  godRay: {
    enabled: false
  },

  spectrum: {
    color: 'default'
  }
}


  },

  get(themeName) {
    return this.themes[themeName] || this.themes.none;
  }
};