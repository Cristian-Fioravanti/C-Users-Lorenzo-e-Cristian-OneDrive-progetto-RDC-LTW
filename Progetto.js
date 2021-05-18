// https://developers.google.com/identity/protocols/OAuth2WebServer

var express = require('express');
var request = require('request');
var session = require('express-session');
const fs = require('fs');
const WebSocket = require('ws');
//const { resolve } = require('node:path');
//const { read } = require('node:fs');
require('dotenv').config()
//var bodyParser = require("body-parser");

const url_utenti= "http://admin:admin@127.0.0.1:5984/utenti";
const url_sondaggi="http://admin:admin@127.0.0.1:5984/sondaggi";

var porta= 3000;
var porta_socket=9998;
const lunghezza_sondaggio_id=10;
var caratteri='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
var socket_sondaggi={};
var pass= {};

/*let rawdata = fs.readFileSync('./secrets.json');
let sec = JSON.parse(rawdata);*/

client_id =process.env.CLIENT_ID;
client_secret =process.env.SECRET;
rapid_api_key=process.env.RAPID_API_KEY;
red_uri="http://localhost:3000/home";

var app = express();
app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: false }));
app.use(session({
	secret: 'RDCprogettoOfTheCorso',
	resave: true,
	saveUninitialized: false,
}));


const wss = new WebSocket.Server({ port: porta_socket });


var a_t = '';

// scopes https://developers.google.com/identity/protocols/googlescopes

//PAGINA INIZIALE
app.get('/', function(req, res){
	res.sendFile("benvenuto.html",{root:__dirname});
});

//LOGIN
app.get('/login', function(req, res){
	res.redirect("https://www.facebook.com/v10.0/dialog/oauth?response_type=code&scope=email&client_id="+client_id+"&redirect_uri=http://localhost:3000/home&client_secret="+client_secret);
});

//LOGOUT
app.get('/logout', function(req, res){
	verifica_sessione(req.session.id_cliente, req.sessionID).then(function(result){
		var uscito= cancella_sessione(req.session.id_cliente);
		uscito.then(function(result){
			console.log("Logout effettuato");
			req.session.destroy();
			res.redirect("http://localhost:3000/");
		});
	}).catch(function(){
		console.log("Logout effettuato comunque");
		req.session.destroy();
		res.redirect("http://localhost:3000/");
	});
});

//PAGINA DI HOME
app.get('/home', function(req,res){
	if(req.query.error=='access_denied'){
		console.log("Errore di permessi non autorizzati");
		res.redirect("http://localhost:3000/");
	} else if(req.query.code!=null){
		var code= req.query.code;
		request.get({url:'https://graph.facebook.com/v10.0/oauth/access_token?client_id='+client_id+'&redirect_uri='+red_uri+'&client_secret='+client_secret+'&code='+code}, function optionalCallback(err, httpResponse, body) {
			if (err) {
				return console.error('upload failed:', err);
			}
			var info = JSON.parse(body);
			if(info.error) {
				res.redirect("http://localhost:3000/login");
			}
			else {
				console.log('Upload successful!  Server responded with:', body);
				//res.send("Got the token "+ info.access_token);
				a_t = info.access_token;
				getDati().then(function(infoPromise) {
					req.session.id_cliente = infoPromise.id;
					req.session.code = code;
					var id = req.session.id_cliente;
					var ss = req.sessionID;
					var nomecognome= infoPromise.name;
					console.log(nomecognome);
					var nome= nomecognome.split(" ")[0];
					var cognome = nomecognome.split(" ")[1];
					var aggiorna = aggiorna_sessione(id, ss, nome, cognome);
					aggiorna.then(function(result){
						if(result){
							res.sendFile("home.html",{root:__dirname});
						}
						else{
							res.redirect("http://localhost:3000/");
							console.log("Variabile di sessione non cambiata o inizializzata");
						}
					})
				});
			}
		});
	} else {
		console.log("Non ha effettuato il login");
		res.redirect("http://localhost:3000/");
	}
});

	// Chiamato da home.html per caricare i dati dell'utente nella pagina
	app.get("/caricautente",function(req,res){
		var verificato= verifica_sessione(req.session.id_cliente, req.sessionID);
		verificato.then(function(result){
			getDati().then(function(result){
				res.send(result.name);
			});
		}).catch(function(){
			req.session.destroy();
			res.redirect("http://localhost:3000/");
		});
	});

	// Chiamato da home.html per caricare i sondaggi dell'utente nella pagina
	app.get("/sondaggi",function(req,res){
		var verificato= verifica_sessione(req.session.id_cliente, req.sessionID);
		verificato.then(function(result){
			if(result==true){
				preleva_id_sondaggi(req.session.id_cliente).then(function(result){
					res.send(result);
				});
			}
		}).catch(function(){
			res.redirect("http://localhost:3000/");
		});
	});

//PAGINA DI VISUALIZZA
app.get("/visualizza",function(req,res){
	var verificato= verifica_sessione(req.session.id_cliente, req.sessionID);
	verificato.then(function(result){
		if(result==true){
			res.sendFile("visualizza.html",{root:__dirname});
		}
	}).catch(function(){
		res.redirect("http://localhost:3000/");
	});

});

	// Chiamato da visualizza.html per visualizzare un sondaggio da id
	app.get("/visualizza2",function(req,res){
		var verificato= verifica_sessione(req.session.id_cliente, req.sessionID);
		verificato.then(function(result){
			if(result==true){
				var id= req.query.id;
				preleva_id_sondaggi(req.session.id_cliente).then(function(result){
						var i=0;
						var resultparse= JSON.parse(result)
						for (i;i<resultparse.length;i++){
							if (resultparse[i].id == id){
								res.send(resultparse[i])
							}
						}
				})
			}
		}).catch(function(){
			res.redirect("http://localhost:3000/");
		});
	});

// PAGINA DI CREA
app.get("/crea",function(req,res){
	var verificato= verifica_sessione(req.session.id_cliente, req.sessionID);
	verificato.then(function(result){
		res.sendFile("crea.html",{root:__dirname});
	}).catch(function(){
		res.redirect("http://localhost:3000/");
	});
});

	//Post del form ricevuto da crea.html per creazione del sondaggio
	app.post("/post",function(req,res){
		var domanda = req.body.domanda;
		console.log(domanda);
		var aggiorna = req.query.aggiorna;
		var ris = req.body.risposta;
		var id = req.body.hiddenid;
		if(aggiorna=="false"){
			genera_sondaggio_id().then(function(result){
				if(domanda.charAt(domanda.length-1)!="?") domanda+= '?';
				var _id = result;
				var corpo = {
					"_id" : _id,
					"url" : "http://localhost:3000/votazione?id="+_id,
					"utente" : req.session.id_cliente,
					"attivo" : false,
					"domanda" : domanda,
					"risposte" : []
				}
				for (let i=0; i<ris.length; i++){
					setTimeout(function(){
						console.log("prima di trova_foto: "+ris[i]);
						trova_foto(ris[i]).then(function(result){
							var url=result.url;
							var agg = [result.parola,0,url]
							corpo.risposte.push(agg);
							if(corpo.risposte.length==ris.length){
								console.log(corpo.risposte);
								aggiorna_sondaggio(corpo,_id).then(function(res1){
									if(res1) aggiungi_sondaggio_a_utente(req.session.id_cliente, _id).then(function(res2){
										if(res2) res.redirect("http://localhost:3000/home?code="+req.session.code);
									});
								});
							}
						})},1000*(i+1));
						
				}
				
			})
		}
		else{
			prendi_corpo_sondaggio(id).then(function(result){
				if(domanda.charAt(domanda.length-1)!="?") domanda+= '?';
				result.sondaggio.domanda = domanda;
				result.sondaggio.risposte = [];
				for (let i=0; i<ris.length; i++){
					console.log(ris[i])
					setTimeout(function(){
						trova_foto(ris[i]).then(function(result1){
							console.log("Prima di trova foto: "+ris[i]);
							var url=result1.url;
							var agg = [result1.parola,0,url]
							result.sondaggio.risposte.push(agg);
							if(result.sondaggio.risposte.length==ris.length){
								aggiorna_sondaggio(result.sondaggio,id).then(function(){
									res.redirect("http://localhost:3000/home?code="+req.session.code);
								});
							}

						});
					},1000*(i*1));
				}
			});
		}	
	});

// PAGINA DI MODIFICA
app.get("/modifica",function(req,res){
	var verificato= verifica_sessione(req.session.id_cliente, req.sessionID);
	verificato.then(function(){
		res.sendFile("modifica.html",{root:__dirname});
	}).catch(function(){
		res.redirect("http://localhost:3000/home?code="+req.session.code);
	});
});

// Richiesta di ELIMINA sondaggio 
app.get("/elimina", function(req,res){
	var verificato= verifica_sessione(req.session.id_cliente, req.sessionID);
	var id_sondaggio = req.query.id;
	verificato.then(function(result){
		if(result) 
		elimina_sondaggio_da_utente(req.session.id_cliente,id_sondaggio).then(function(result){
			if(result) res.send("http://localhost:3000/home?code="+req.session.code);
		})
	}).catch(function(){
		res.send("http://localhost:3000/");
	});
});

// Condividi sondaggio
app.get("/condividi",function(req,res){
	var verificato= verifica_sessione(req.session.id_cliente, req.sessionID);
	var id_sondaggio = req.query.id;
	verificato.then(function(result){
		prendi_corpo_sondaggio(id_sondaggio).then(function(result){
			if(result.sondaggio.attivo)
				res.send("https://www.facebook.com/dialog/share?app_id=132778522139768&display=popup&href=https://travelfree.altervista.org/&quote=Votate il mio sondaggio qui: http://locahost:3000/votazione?id="+id_sondaggio);
			else{
				var risposta = result.sondaggio.risposte[0][0];
				var domanda = result.sondaggio.domanda;
				res.send("https://www.facebook.com/dialog/share?app_id=132778522139768&display=popup&href=https://travelfree.altervista.org/&quote=Ho creato un sondaggio con EasySurvey!! La domanda era: "+domanda.toUpperCase()+" Ha vinto la risposta: "+risposta.toUpperCase()+"!!");
			}
		})
	}).catch(function(){
		res.redirect("http://localhost:3000/visualizza?id="+id_sondaggio);
	});
})

// Attiva un sondaggio, ritorna un json in cui esiste parola che è password per attivare il socket, COMPLETATO
app.get("/attiva_sondaggio", function(req,res){
	var id_sondaggio = req.query.id;
	var verificato= verifica_sessione_sondaggio(req.session.id_cliente, req.sessionID,id_sondaggio);
	verificato.then(function(result){
		if(result) {
			attiva_sondaggio(id_sondaggio).then(function(result){
				if(result) {
					pass[id_sondaggio]= Math.random().toString();
					var da_ritornare={};
					da_ritornare.parola=pass[id_sondaggio];
					da_ritornare.url="http://localhost:3000/votazione?id="+id_sondaggio;
					res.send(JSON.stringify(da_ritornare));
				}
				else res.send("Errore attiva")
			},function(err){
				if(err=="già attivo"){
					var da_ritornare={};
					pass[id_sondaggio]= Math.random().toString();
					da_ritornare.parola=pass[id_sondaggio];
					da_ritornare.url="http://localhost:3000/votazione?id="+id_sondaggio;
					res.send(JSON.stringify(da_ritornare));
				}
			})
		}
	}).catch(function(){
		res.send("http://localhost:3000/");
	});
});

// Disattiva sondaggio, COMPLETATO
app.get("/disattiva_sondaggio", function(req,res){
	var id_sondaggio = req.query.id;
	var verificato= verifica_sessione_sondaggio(req.session.id_cliente, req.sessionID,id_sondaggio);
	verificato.then(function(result){
		if(result) {
			disattiva_sondaggio(id_sondaggio).then(function(result){
				if(result){ 
					if(socket_sondaggi[id_sondaggio]){
						socket_sondaggi[id_sondaggio].close();
						delete socket_sondaggi[id_sondaggio];
					}
					res.send("disattivato");
				}
				else res.send("Errore attiva")
			})
		}
	}).catch(function(){
		res.send("http://localhost:3000/");
	});
});

// Accetta risposte ad un sondaggio, COMPLETATO
app.get("/vota/[0-9a-zA-Z]{"+lunghezza_sondaggio_id+"}",function(req,res){
	console.log(req.url);
	var sondaggio=(req.url.split("/"))[2];
	sondaggio=sondaggio.substring(0,lunghezza_sondaggio_id);
	console.log(sondaggio);
	var attivo=verifica_attivo(sondaggio);
	attivo.then(function(result){
		
		var voto=req.query.risposta;
		var sondaggio_corpo=result.sondaggio;
		var voti=sondaggio_corpo.risposte;
		var i=0;
		while(i<voti.length && voti[i][0]!=voto){
			i++;
		}
		if(i==voti.length) {
			res.send("Voto non accettato");
			return;
		}
		voti[i][1]+=1;
		var cambiato=false;
		while(i>0 && voti[i][1]>voti[i-1][1]){
			cambiato=true;
			var temp=voti[i];
			voti[i]=voti[i-1];
			voti[i-1]=temp;
			i--;
		}
		sondaggio_corpo.risposte=voti;
		var aggiornato=aggiorna_sondaggio(sondaggio_corpo,sondaggio);
		aggiornato.then(function(result){
			if(result){
				res.send("Risposta registrata con successo");
				var oggetto={};
				oggetto.risposte=voti;
				socket_sondaggi[sondaggio].send(JSON.stringify(oggetto));

			}
			else{
				res.send(false);
			}
		},function(err){res.send("Risposta non registrata");});
	},function(err){
		res.send(err);
	});
});

// chiamato dalla pagina di votazione per visualizzare il sondaggio e le risposte accettabili
app.get("/sondaggio/[0-9a-zA-Z]{"+lunghezza_sondaggio_id+"}",function(req,res){
	var sondaggio=(req.url.split("/"))[2];
	var attivo=verifica_attivo(sondaggio);
	attivo.then(function(result){
		if(result){
			var da_ritornare={};
			var sondaggio_corpo=result.sondaggio;
			da_ritornare.domanda=sondaggio_corpo.domanda;
			var lista=sondaggio_corpo.risposte;
			for(var i=0;i<lista.length;i++){
				lista[i]=lista[i][0];
			}
			lista = lista.sort(() => Math.random() - 0.5)
			da_ritornare.risposte=lista;
			prendi_nome_creatore(sondaggio_corpo.utente).then(function(result1){
				da_ritornare.nome=result1.nome;
				da_ritornare.cognome=result1.cognome;
				console.log(JSON.stringify(da_ritornare));
				res.send(da_ritornare);
			})
		}
		else{
			res.send(false);
		}
	},function(err){
		res.send(false);
	});
})

// 
app.get("/votazione",function(req,res){
	verifica_attivo(req.query.id).then(function(result){
		if(result)
			res.sendFile("votazione.html",{root:__dirname});	
	}).catch(function(){
		res.sendFile("votazione_errore.html",{root:__dirname});
	});
})

// Votazione completata
app.get("/votazione_completata",function(req,res){
	res.sendFile("votazione_completata.html",{root:__dirname});
})

//-----------------API-------------------------//
// Recuperare tutte le domande
app.get("/trovaDomandaSondaggi",function(req,res){
	prendi_domande().then(function(result){
		res.send(result)
	})
});

// Recuperare le risposte da una domanda
app.get("/trovaRisposteDomanda",function(req,res){
	var domanda= req.query.domanda;
	var r=[];
	prendi_domande().then(function(result){
		for (let i = 0; i < result.length; i++) {
			if(result[i].domanda.toUpperCase() == domanda.toUpperCase())
				richiesta_db(result[i].id).then(function(result1){
					var a = [];
					for (let j = 0; j < result1.risposte.length; j++) {
						var k= {};
						k.risposta = result1.risposte[j][0];
						k.voti = result1.risposte[j][1];
						a.push(k);
						if(a.length == result1.risposte.length) {
							r.push(a);
						}
					}
					if(r.length== result.length) {
						unisci(r.filter(x => x!=null).flat()).then(function(risposta){
							res.send(risposta);
						})
					}
				})
			else {
				r.push(null);
				if(r.length== result.length) {
					unisci(r.filter(x => x!=null).flat()).then(function(risposta){
						res.send(risposta);
					});
				}
			}
		}
	})
	
});

// Recuperare Domanda e Risposte da parola chiave
app.get("/trovaSondaggiChiave",function(req,res){
	var chiave = req.query.chiave;
	prendi_domande().then(function(result){
		var r = [];
		for(let i=0; i<result.length; i++){
			if(result[i].domanda.toUpperCase().match(chiave.toUpperCase())!=null){
				richiesta_db(result[i].id).then(function(result1){
					var k= {};
					k.id = result[i].id;
					k.domanda = result[i].domanda;
					k.risposte = result1.risposte;
					r.push(k);
					if(r.length==result.length) {
						console.log(r.filter(x => x!=null));
						res.send(r.filter(x => x!=null));
					}
				});	
			}
			else {
				r.push(null);
				if(r.length==result.length) {
					console.log(r.filter(x => x!=null));
					res.send(r.filter(x => x!=null));
				}
			}
		}
	})
});



//----------------SOCKET-----------------------//

//aprire una socket per un dato sondaggio, COMPLETATO
wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(data) {
		var oggetto=JSON.parse(data);
		//console.log("socket iniziato");
		//console.log(pass[oggetto.sondaggio],"--",oggetto.parola,"--",oggetto.sondaggio);
		if (pass[oggetto.sondaggio]==oggetto.parola && pass[oggetto.sondaggio]!=null){
			//console.log("va benissimo");
			socket_sondaggi[oggetto.sondaggio]=ws;
			delete pass[oggetto.sondaggio];
			ws.send("verificato");
			//console.log(socket_sondaggi[oggetto.sondaggio]);
		}else{
			console.log("non verificato");
			ws.send(false);
		}

	});
});


// ----- INIZIO FUNZIONI AUSILIARIE ----- //

// Prendi i dati dell'utente da fb
function getDati() {
	return new Promise(function(resolve, reject){
		request.get({url:'https://graph.facebook.com/v10.0/me/?fields=name,email,id&access_token='+a_t}, function (err, httpResponse, body) {
			if(err) {
				console.log('upload failed:', err);
				reject("Errore di richiesta dati"); console.error('upload failed:', err);
			} else {
				//console.log("I dati dell'utente sono: ", body);
				var info= JSON.parse(body);
				resolve(info);
			}
		});
	});
}

// Aggiorna il valore sessione dell'utente, e se non esiste lo crea passando nome e cognome
function aggiorna_sessione(id,sessione,nome,cognome){
	return new Promise(function(resolve,reject){
		request({
			url: url_utenti+"/"+id,
			method: "GET"
		},function(err,res,body){
				if(err) {reject(err);}
				else if(res.statusCode==404){
					var oggetto={
						"_id": id,
						"sondaggi": [],
						"sessione": sessione,
						"nome": nome,
						"cognome": cognome
					}
					request({
						url: url_utenti+'/'+id,
						method:"PUT",
						body: JSON.stringify(oggetto)
					},function(err,res,body){
						if(err) reject(err);
						else if(res.statusCode!=201) reject("Errore PUT nuovo aggiorna_sessione");
						else{
							resolve(true);
						}
					});
				}
				else if(res.statusCode!=200) reject("Errore GET aggiorna_sessione");
				else{
						var oggetto=JSON.parse(body);
						oggetto.sessione=sessione;
						request({
							url: url_utenti+'/'+id,
							method:"PUT",
							body: JSON.stringify(oggetto)
						},function(err,res,body){
							//console.log(res.statusCode);
							if(err) reject(err);
							else if(res.statusCode!=201) reject("Errore PUT esistente aggiorna_sessione");
							else{
								resolve(true);
							}
						});
				}
			})
		})
}

// Cancella valore della sessione di un utente
function cancella_sessione(id){
	return new Promise(function(resolve,reject){
		request({
			url: url_utenti+"/"+id,
			method:"GET"
		},function(err,res,body){
			if(err) reject(err);
			else if(res.statusCode!=200) reject("Errore cancella_sessione");
			else{
					var oggetto=JSON.parse(body);
					oggetto.sessione= "";
					request({
						url: url_utenti+'/'+id,
						method:"PUT",
						body: JSON.stringify(oggetto)
					},function(err,res,body){
						if(err) reject(err);
						else if(res.statusCode!=201) reject("Errore aggiorna_sessione");
						else{
							resolve(true);
						}
					});
				}
			});
	});
}

// verifica se la sessione dell'utente è uguale a quella in db
function verifica_sessione(id,sessione){
	return new Promise(function(resolve,reject){
			request({
					url: url_utenti+"/"+id,
					method:"GET"
			},function(err,res,body){
					if(err) reject(err);
					else if(res.statusCode!=200) reject("sessione non trovato");
					else{
							var oggetto=JSON.parse(body);
							if(oggetto.sessione==sessione){
									resolve(true);
							}else{
									reject("sessione");
							}
					}

			});
	});
}

// Verifica che un sondaggio sia dell'utente
function verifica_padronanza(id,sondaggio_id){
	return new Promise(function(resolve,reject){
			request({
					url: url_sondaggi+"/"+sondaggio_id,
					method:"GET"
			},function(error,res,body){
					if(error) reject(error);
					else if (res.statusCode!=200) reject("non trovato");
					else{
							var oggetto=JSON.parse(body);
							if(oggetto.utente==id) resolve(true);
							else reject("padrone");
					}
			});
	});
}

// Verifica la sessione dell'utente e la padronanza del sondaggio
function verifica_sessione_sondaggio(id,sessione,sondaggio_id){
	return new Promise(function(resolve,reject){
			var verificato_sessione=verifica_sessione(id, sessione);
			var verificato_padronanza=verifica_padronanza(id, sondaggio_id);
			verificato_sessione.then(function(result){
					if(result===true){
							verificato_padronanza.then(function(result){
									if(result===true)
											resolve(true);
									else
											reject("padronanza");
							},function(err){
									reject(err);
							});
					}
					else{
							reject("sessione");
					}
			},function(err){
					reject(err);
			});

	});
}

// Attiva sondaggio
function attiva_sondaggio(id_sondaggio){
	return new Promise(function(resolve,reject){
			request({
					url: url_sondaggi+"/"+id_sondaggio,
					method:"GET"
			},function(error,response,body){
					if(error || response.statusCode!=200)
							reject("sondaggio");
					else{
							var sondaggio=JSON.parse(body);
							if(sondaggio.attivo==true){
									reject("già attivo");
							}
							else{
									sondaggio.attivo=true;
									request({
											url: url_sondaggi+"/"+id_sondaggio,
											method:"PUT",
											body: JSON.stringify(sondaggio)
									},function(error,response,body){
											if(error || response.statusCode!=201){
													reject("errore");
											}
											else{
													resolve(true);
											}
									});
							}
					}
			});
	});
}

// Disattiva sondaggio
function disattiva_sondaggio(id_sondaggio){
	return new Promise(function(resolve,reject){
			request({
					url: url_sondaggi+"/"+id_sondaggio,
					method:"GET"
			},function(error,response,body){
					if(error || response.statusCode!=200)
							reject("sondaggio");
					else{
							var sondaggio=JSON.parse(body);
							if(sondaggio.attivo==false){
									reject("disattivo");
							}
							else{
									sondaggio.attivo=false;
									request({
											url: url_sondaggi+"/"+id_sondaggio,
											method:"PUT",
											body: JSON.stringify(sondaggio)
									},function(error,response,body){
											if(error || response.statusCode!=201){
													reject("errore");
											}
											else{
													resolve(true);
											}
									});
							}
					}
			});
	});
}

// Genera id per i nuovi sondaggi, COMPLETATO
function genera_sondaggio_id(){
	var continua=true;
	return new Promise(function(resolve,reject){
			//console.log(continua);
			let risultato='';
			for(let i=0;i<lunghezza_sondaggio_id;i++){
				risultato+=caratteri.charAt(Math.floor(Math.random()*caratteri.length));
			}
			sondaggio_non_presente(risultato).then(function(result){
				if(result){
					continua=false;
					//console.log(risultato);
					//console.log(risultato);
					resolve(risultato);
				}else{
					genera_sondaggio_id().then(function(res){
						console.log(res);
						resolve(res);
					},function(e){console.log(e);});
				}
			},function(err){
				genera_sondaggio_id().then(function(res){
					console.log(res);
					resolve(res);
				},function(e){console.log(e);});
			});
	
		
	})
}

// Verifica se un certo sondaggio non è presente, COMPLETATO
function sondaggio_non_presente(id){
	console.log(id);
	return new Promise(function(resolve,reject){
		request({
			url:url_sondaggi+"/"+id,
			method:"GET"
		},function(err,res,body){
			if(res.statusCode==404){
				resolve(true);
			}else{
				reject(false);
			}
		});
	});
}

// Prendo nome e cognome creatore del sondaggio
function prendi_nome_creatore(id){
	return new Promise(function(resolve,reject){
		request({
			url:url_utenti+"/"+id,
			method:"GET"
		},function(err,res,body){
			if(err) reject(err);
			else if(res.statusCode!=200) reject(JSON.parse(body).error)
			else{
				var corpo = JSON.parse(body)
				var oggetto={};
				oggetto.nome=corpo.nome;
				oggetto.cognome= corpo.cognome;
				resolve(oggetto);
			}
		});
	});
}

// Ritorno il corpo di un sondaggio 
function prendi_corpo_sondaggio(id){
	return new Promise(function(resolve,reject){
		request({
			url:url_sondaggi+"/"+id,
			method:"GET"
		},function(err,res,body){
			if(err) reject(err);
			else if(res.statusCode!=200) reject(JSON.parse(body).error)
			else{
				var oggetto={};
				oggetto.sondaggio=JSON.parse(body);
				resolve(oggetto);
			}
		});
	});
}

// Funzione per prendere tutte le domande del DB
function prendi_domande(){
	return new Promise(function(resolve,reject){
		request({
			url:url_sondaggi+'/_all_docs?include_docs=true',
			method:"GET"
		},function(err,res,body){
			if(err) reject(err);
			else if(res.statusCode!=200) reject(JSON.parse(body).error)
			else{
				var oggetto = JSON.parse(body);
				var rows = oggetto.total_rows;
				var sondaggi = oggetto.rows;
				var risultato= [];
				for(let i=0; i<rows; i++){
					var r = {};
					r.id = sondaggi[i].id;
					r.domanda = sondaggi[i].doc.domanda;
					risultato.push(r);
				}
				resolve(risultato);
			}
		});
	});
}

// Unisci risposte da ritornare all'API
function unisci(array){
	return new Promise(function(resolve, reject){
		var x = [];
		for(var i=0; i<array.length; i++){
			var ris = array[i].risposta;
			var voto = array[i].voti;
			var modificato = false;
			for(var j=0; j<x.length; j++){
				if(x[j].risposta.toUpperCase() == ris.toUpperCase()) {
					x[j].voti += voto;
					modificato = true;
				}
			}
			if(!modificato) {
				var k = {}
				k.risposta = ris;
				k.voti = voto;
				x.push(k);
			}
		}
		resolve(x);
	})
}

// Verifica se un dato sondaggio è attivo o meno e ritorna il corpo in result.sondaggio, COMPLETATO
function verifica_attivo(id){
	return new Promise(function(resolve,reject){
		request({
			url : url_sondaggi+"/"+id,
			method : "GET"
		},function(error, response,body){
			if(error){
				reject(error);
			}else if(response.statusCode!=200){
				reject(JSON.parse(body).error)
			}else{
				if(JSON.parse(body).attivo==true){
					var oggetto={};
					oggetto.sondaggio=JSON.parse(body);
					resolve(oggetto);
				}
				else{
					reject("sondaggio_non_attivo");
				}
			}
		});

	});

}

// Aggiorna il file del sondaggio con un nuovo corpo passato come parametro, COMPLETATO
function aggiorna_sondaggio(corpo,id){
	return new Promise(function(resolve,reject){
		request({
			url : url_sondaggi+"/"+id,
			method:"PUT",
			body: JSON.stringify(corpo)
		},function(error,response,body){
			if(error) reject(error);
			else if (response.statusCode!=201) reject(response.statusCode);
			else{
				console.log("aggiornato");
			 	resolve(true);}
		});
	});
}

// Aggiungi un sondaggio all' utente
function aggiungi_sondaggio_a_utente(id_utente, id_sondaggio){
	return new Promise(function(resolve,reject){
		request({
			url: url_utenti+"/"+id_utente,
			method:"GET"
		},function(err,res,body){
			if(err) reject(err);
			else if(res.statusCode!=200) reject("Errore cancella_sessione");
			else{
					var oggetto=JSON.parse(body);
					oggetto.sondaggi.push(id_sondaggio);
					request({
						url: url_utenti+'/'+id_utente,
						method:"PUT",
						body: JSON.stringify(oggetto)
					},function(err,res,body){
						if(err) reject(err);
						else if(res.statusCode!=201) reject("Errore aggiorna_sessione");
						else{
							resolve(true);
						}
					});
				}
			});
		});
}

// Elimino un sondaggio
function elimina_sondaggio_da_utente(id_utente, id_sondaggio){
	return new Promise(function(resolve,reject){
		request({
			url: url_utenti+"/"+id_utente,
			method: "GET"
		}, function(err,res,body){
			if(err) {reject(err);}
			else if(res.statusCode!=200){reject(res.statusCode+" Errore GET utente");}
			else{
				var oggetto=JSON.parse(body);
				var sondaggi = oggetto.sondaggi;
				for( var i = 0; i < sondaggi.length; i++){
					if ( sondaggi[i] == id_sondaggio) { 
						var j = sondaggi.splice(i,1);
					}
				}
				request({
					url: url_utenti+"/"+id_utente,
					method: "PUT",
					body: JSON.stringify(oggetto)
				}, function(err,res,body){
					if(err) reject(err);
					else if(res.statusCode!=201) reject("Errore PUT sondaggi aggiornati in utente");
					else{
						elimina_sondaggio(id_sondaggio).then(function(result){
							if(result) resolve(true);
							else reject("Errore cancellazione sondaggio");
						});
					}
				});
			}
		});	
	});
}

// Elimino sondaggio dal db
function elimina_sondaggio(id_sondaggio){
	return new Promise(function(resolve,reject){
		prendi_corpo_sondaggio(id_sondaggio).then(function(result){
			//console.log(result.sondaggio._rev);
			request({
				url: url_sondaggi+"/"+id_sondaggio+"?rev="+result.sondaggio._rev,
				method: "DELETE",
			},function(err,res,body){
				if(err) {reject(err);}
				else if(res.statusCode!=200){reject(false);}
				else {
					resolve(true);
				}
			});	
		})
	});
}

// Prelevo i sondaggi di un utente dal suo id
function preleva_id_sondaggi(id_utente){
	return new Promise(function(resolve,reject){
		var k = [];
		request({
			url: url_utenti+"/"+id_utente,
			method: "GET"
		}, function(err,res,body){
			if(err) {reject(err);}
			else if(res.statusCode!=200){reject("Errore GET sondaggi dall'id utente");}
			else{
				var oggetto=JSON.parse(body);
				var sondaggi = oggetto.sondaggi;
				for(var i=0; i<sondaggi.length; i++){
					richiesta_db(sondaggi[i]).then(function(result){
						k.push(result);
						//console.log("questo è k :"+ JSON.stringify(k));
						if (k.length==sondaggi.length) {
							var j;
							var z= [];
							for(var j=0; j<sondaggi.length; j++){
								for(i=0; i<k.length; i++){
									if(sondaggi[j] == k[i].id)
										z.push(k[i]);
								}
							}
							resolve(JSON.stringify(z));
						}
					});
				}
				
			}
		});	
	});
}

// Richiesta al db di un sondaggio tramite id
function richiesta_db(id_sondaggio){
	return new Promise(function(resolve,reject){
		request({
			url: url_sondaggi+"/"+id_sondaggio,
			method: "GET"
		}, function(err,res,body){
			if(err) {reject(err);}
			else if(res.statusCode!=200){ console.log(res.statusCode+ url_sondaggi +" "+ id_sondaggio); console.log("Errore GET sondaggi in richiesta_db");}
			else{
				var oggetto=JSON.parse(body);
				var id = oggetto._id;
				var domanda = oggetto.domanda;
				var risposte = oggetto.risposte;
				var attivo = oggetto.attivo;
				var link = oggetto.url;
				var r = {};
				r.id = id;
				r.attivo = attivo;
				r.domanda = domanda;
				r.risposte = risposte;
				r.link = link;
				resolve(r);
			}
		});
	});
}

//trovare url della foto mediante bing, COMPLETATO
function trova_foto(foto){
	const options = {
		method: 'GET',
		url: 'https://bing-image-search1.p.rapidapi.com/images/search',
		qs: {q: foto, count: '1'},
		headers: {
			'x-rapidapi-key': rapid_api_key,
			'x-rapidapi-host': 'bing-image-search1.p.rapidapi.com',
			useQueryString: true
		}
	};
	return new Promise(function(resolve,reject){
		request(options, function (error, response, body) {
			console.log(response.statusCode)
			if (error) reject(error);
		
			else if(response.statusCode!=200){
				reject("errore trova foto");
			}	 
			else{
				var ritornato=JSON.parse(body);
				//console.log(ritornato["_type"]);
				var url_foto=((ritornato.value)[0]).contentUrl;
				var oggetto={};
				oggetto.url=url_foto;
				oggetto.parola = foto;
				console.log("In trova foto: "+oggetto.parola);
				resolve(oggetto);
			}

		});
	});
}

// ----- FINE FUNZIONI AUSILIARIE ----- //

app.listen(porta,function(){
	console.log("server avviato con successo sulla porta "+porta);
});
