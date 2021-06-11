define({ "api": [
  {
    "type": "get",
    "url": "/trovaDomandaSondaggi",
    "title": "Get tutte le domande",
    "name": "GetDomande",
    "group": "Guest",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>ID del Sondaggio</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "domanda",
            "description": "<p>Domanda del sondaggio</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success 200:",
          "content": "[\n     {\"domanda\":\"Scegli tra?\"},\n     {\"domanda\":\"Nuova versione?\"},\n     {\"domanda\":\"Che sport fai?\"},\n     {\"domanda\":\"Scegli tra?\"}\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "errore",
            "description": "<p>Nessun sondaggio disponibile</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error 404 Not Found:",
          "content": "{\n   \"errore\" : \"Errore non ci sono sondaggi disponibili\"\n }",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./ApiDocES.js",
    "groupTitle": "Guest",
    "sampleRequest": [
      {
        "url": "https://localhost:3000/api/trovaDomandaSondaggi"
      }
    ]
  },
  {
    "type": "get",
    "url": "/trovaRisposteDomanda?domanda=:domanda",
    "title": "Get risposte di una specifica domanda e relativi voti cumulativi",
    "name": "trovaRisposteDomanda",
    "group": "Guest",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "domanda",
            "description": "<p>Domanda del sondaggio</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "risposta",
            "description": "<p>Risposta alla domanda <code>domanda</code></p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "voto",
            "description": "<p>Numero di volte che <code>risposta</code> è stata votata in tutti i sondaggi che hanno per domanda <code>domanda</code></p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success 200:",
          "content": " [\n     {\"risposta\":\"Pane\",\"voti\":2},\n     {\"risposta\":\"Pasta\",\"voti\":0},\n     {\"risposta\":\"Pizza\",\"voti\":0}\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "errore",
            "description": "<p>La <code>domanda</code> non è stata trovata nel db</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error 404 Not Found:",
          "content": "{\n   \"errore\":\"Errore, non trovo la domanda: domanda\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./ApiDocES.js",
    "groupTitle": "Guest",
    "sampleRequest": [
      {
        "url": "https://localhost:3000/api/trovaRisposteDomanda?domanda=:domanda"
      }
    ]
  },
  {
    "type": "get",
    "url": "/trovaSondaggiChiave?chiave=:chiave",
    "title": "Get domande con parola chiave e relative risposte",
    "name": "trovaSondaggiChiave",
    "group": "Guest",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "chiave",
            "description": "<p>Parola chiave</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>ID del Sondaggio</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "domanda",
            "description": "<p>Domanda del sondaggio</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "risposte",
            "description": "<p>Array di risposte alla domanda</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success 200:",
          "content": " [\n      {\n          \"domanda\":\"Scegli tra?\",\"risposte\":[[\"Pane\",1],[\"Pizza\",0]]\n      },\n\n      {\n          \"domanda\":\"Scegli tra?\",\"risposte\":[[\"Pane\",1],[\"Pasta\",0]]\n      }\n]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "errore",
            "description": "<p>la <code>chiave</code> non è stata trovata nel db</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error 404 Not Found:",
          "content": "{\n   \"errore\":\"Errore, nessuna domanda con la parola chiave: chiave\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./ApiDocES.js",
    "groupTitle": "Guest",
    "sampleRequest": [
      {
        "url": "https://localhost:3000/api/trovaSondaggiChiave?chiave=:chiave"
      }
    ]
  }
] });
