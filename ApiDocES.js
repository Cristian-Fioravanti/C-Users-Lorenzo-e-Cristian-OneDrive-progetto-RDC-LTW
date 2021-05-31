/*
 * EasySurvey
 *
 * This is a basic example for apiDoc.
 * Documentation blocks without @api (like this block) will be ignored.
 * //@apiParam {Number} id Users unique ID.
 */

///////////////////////////////////////////////////////

/**    
 * @api {get} /trovaRisposteDomanda?domanda=:domanda Get risposte di una specifica domanda e relativi voti cumulativi
 * @apiName trovaRisposteDomanda
 * @apiGroup Guest
 *
 * @apiParam {String} domanda Domanda del sondaggio
 *
 * @apiSuccess {String} risposta Risposta alla domanda <code>domanda</code>
 * @apiSuccess {String} voto  Numero di volte che <code>risposta</code> è stata votata in tutti i sondaggi che hanno per domanda <code>domanda</code>
 *
 * @apiSuccessExample Success 200:
 *     [
 *         {"risposta":"Pane","voti":2},
 *         {"risposta":"Pasta","voti":0},
 *         {"risposta":"Pizza","voti":0}
 *    ]
 *
 *
 *  @apiError errore La <code>domanda</code> non è stata trovata nel db
 * @apiErrorExample Error 404 Not Found:
 *       {
 *          "errore":"Errore, non trovo la domanda: domanda"
 *       }
 *  
 *
*/
///////////////////////////////////////////////////////

/**    
 * @api {get} /trovaSondaggiChiave?chiave=:chiave Get domande con parola chiave e relative risposte
 * @apiName trovaSondaggiChiave
 * @apiGroup Guest
 *
 * @apiParam {String} chiave Parola chiave
 *
 * @apiSuccess {String} id ID del Sondaggio
 * @apiSuccess {String} domanda  Domanda del sondaggio
 * @apiSuccess {String} risposte  Array di risposte alla domanda
 * @apiSuccessExample Success 200:
 *     [
 *          {
 *              "domanda":"Scegli tra?","risposte":[["Pane",1],["Pizza",0]]
 *          },
 * 
 *          {
 *              "domanda":"Scegli tra?","risposte":[["Pane",1],["Pasta",0]]
 *          }
 *    ]
 *
 *
 *  @apiError errore la <code>chiave</code> non è stata trovata nel db
 * @apiErrorExample Error 404 Not Found:
 *       {
 *          "errore":"Errore, nessuna domanda con la parola chiave: chiave"
 *       }
 *  
 *
*/
///////////////////////////////////////////////////////
/**
 * @api {get} /trovaDomandaSondaggi Get tutte le domande
 * @apiName GetDomande
 * @apiGroup Guest
 *
 * 
 *
 * @apiSuccess {String} id ID del Sondaggio
 * @apiSuccess {String} domanda  Domanda del sondaggio
 *
 * @apiSuccessExample Success 200:
 *     [
 *          {"domanda":"Scegli tra?"},
 *          {"domanda":"Nuova versione?"},
 *          {"domanda":"Che sport fai?"},
 *          {"domanda":"Scegli tra?"}
 *     ]
 *
 * @apiError errore Nessun sondaggio disponibile
 *
 * @apiErrorExample Error 404 Not Found:
 *     {
 *        "errore" : "Errore non ci sono sondaggi disponibili"
 *      }
 * 
*/
