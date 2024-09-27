const mongoose = require('mongoose');

const laundryServiceSchema = new mongoose.Schema({
  services: {
    ropaPorKilo: {
      type: Number
    },
    secado: {
      type: Number
    },
    lavadoExpress: {
      type: Number
    },
    toallasSabanas: {
      type: Number
    },
    vanishCloroSuavitel: {
      type: Number
    },
    edredon: {
      individual: {
        type: Number
      },
      matrimonial: {
        type: Number
      },
      queenKing: {
        type: Number
      }
    },
    cobija: {
      individual: {
        type: Number
      },
      matrimonial: {
        type: Number
      },
      queenKing: {
        type: Number
      }
    },
    extras: {
      suavitel: {
        type: Number
      },
      cloro: {
        type: Number
      },
      vanish: {
        type: Number
      }
    },
    almohada: {
      chica: {
        type: Number
      },
      mediana: {
        type: Number
      },
      grande: {
        type: Number
      }
    },
    cubrecolchon: {
      type: Number
    },
    hamaca: {
      type: Number
    },
    tennis: {
      type: Number
    },
    cortinasManteles: {
      type: Number
    }
  }
});

module.exports = mongoose.model('LaundryService', laundryServiceSchema);
