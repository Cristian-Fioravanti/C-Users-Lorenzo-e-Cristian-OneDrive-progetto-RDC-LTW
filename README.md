# EasySurvey

## Scopo del progetto: 

Il nostro è un servizio per creare sondaggi da far votare ad altri e poter condividerne i risultati su Facebook. Inoltre, sono resi disponibili i sondaggi e i relativi risultati di tutti gli utenti che hanno utilizzato il nostro servizio.

---

## Architetture utilizzate tramite diagramma: 
![Diagramma](SCHEMA.png)

---

## Soddisfacimento dei requisiti:

* Servizio REST: API documentate mediante [ApiDoc](https://localhost:3000/api);
* Servizio REST di terze parti: Bing Image Search:
* Servizio REST commerciale: Facebook;
* Servizio OAuth: Facebook;
* Protocollo asincrono: WebSocket che aggiorna i risultati dei sondaggi in real-time;

---

## Utilizzo:
1) Aprire un terminale nella directory principale (dove si trova il file **docker-compose.yml**) ed eseguire il comando:
<code>docker-compose up -d</code>;
2) Dal browser visitare [questa pagina](https://localhost:3000/);
3) Dopo l'accesso divertiti a utilizzare il nostro servizio;
4) Per fermare il server eseguire il comando: <code>docker-compose stop</code> (questo fermerà i container di CouchDB e Node);
5) Per riavviare il server eseguire il comando: <code>docker-compose start</code> (questo avvierà i container di CouchDB e Node).
***
**Cristian Fioravanti 1861593**

**Mohab Atanasious 1861248**

**Paolo Caruso 1843152**
