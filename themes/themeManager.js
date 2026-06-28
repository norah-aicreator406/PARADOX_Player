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
  src: "./themes/aurora/aurora-bg.jpg",
  opacity: 1
}

}

  },

  get(themeName) {
    return this.themes[themeName] || this.themes.none;
  }
};