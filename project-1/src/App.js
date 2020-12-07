import React, {useState} from 'react';
import './App.css';
import builder from 'xmlbuilder';


function App(){
  
  const express = require('express');
  const app = express();
  const path = require('path');
  const publicPath = path.join(__dirname, '..', 'public');
  
  app.use(express.static(publicPath));

  const [key, setKey] = useState("8338185i34m5jnbx4b4djjgcqwwe2bfv3zabbpm7rk");

  const [nyugtaList, setList] = useState([]);
  const [currentlySelected, setCurrentlySelected] = useState("");

  const [nyugta, setNyugta] = useState({
    nyugtakep:"A",
    fizmod:"átutalás",
    penznem:"HUF",
    megnevezes:"teszt",     //TO-DO
    mennyiseg:"10",         //To-do
    mennyisegiEgyseg:"db",  
    nettoEgysegar:"750",   //to-do
  });

  const [email, setEmail] = useState("");

  const afaMagyarorszag = 27;

  const changeKey = (e) => {
    setKey(e.target.value);
  }

  const nyugtaFormChangeHandler = (e) =>{
    setNyugta(prevState => ({...prevState,[e.target.id]:e.target.value}))
  }
  
  const addNyugtaszamToList = (szam) =>{
    setList(prevList =>[...prevList,szam]);
  }

  const updateCurrentlySelected = (e) =>{
    setCurrentlySelected(e.target.id);
  }

  const changeEmail = (e) => {
    setEmail(e.target.value);
  }

  var parser = new DOMParser();

  const CreateNyugta = ()=> {
  
    var xml = builder.create('xmlnyugtacreate');
    xml.att('xmlns','http://www.szamlazz.hu/xmlnyugtacreate');
    xml.att('xmlns:xsi','http://www.w3.org/2001/XMLSchema-instance');
    xml.att('xsi:schemaLocation','http://www.szamlazz.hu/xmlnyugtacreate http://www.szamlazz.hu/docs/xsds/nyugta/xmlnyugtacreate.xsd');
    
    var beallitasok = xml.ele('beallitasok');
    beallitasok.ele('szamlaagentkulcs', key);
    beallitasok.ele('pdfLetoltes', true);

    var fejlec = xml.ele('fejlec');
    fejlec.ele('elotag', 'NYGTA');
    fejlec.ele('fizmod', nyugta.fizmod);
    fejlec.ele('penznem', nyugta.penznem);

    var tetel = xml.ele('tetelek').ele('tetel');

    var nettoOssz =  nyugta.mennyiseg * nyugta.nettoEgysegar;
    var afaOssz = Math.round(afaMagyarorszag * nettoOssz / 100);
    var brutto = nettoOssz + afaOssz;

    tetel.ele('megnevezes', nyugta.megnevezes);
    tetel.ele('mennyiseg', nyugta.mennyiseg);
    tetel.ele('mennyisegiEgyseg', nyugta.mennyisegiEgyseg);
    tetel.ele('nettoEgysegar', nyugta.nettoEgysegar);
    tetel.ele('netto', nettoOssz );
    tetel.ele('afakulcs', afaMagyarorszag);
    tetel.ele('afa', afaOssz);
    tetel.ele('brutto', brutto);
  
    xml.end({ pretty: true});

    fetch('https://mid-szamlazz.herokuapp.com/create', {
      method: 'POST',
      body:xml
    })
    .then(response => response.json())
    .then(data => {
      var xmlDoc = parser.parseFromString(data.data,"text/xml");
      var sikeres = xmlDoc.getElementsByTagName("sikeres")[0].firstChild.nodeValue;

      if(sikeres === "true") {
        alert("Sikeres!");
        var nyugtaszam = xmlDoc.getElementsByTagName("nyugtaszam")[0].firstChild.nodeValue;
        addNyugtaszamToList(nyugtaszam);
        var pdf = xmlDoc.getElementsByTagName("nyugtaPdf")[0].firstChild.nodeValue;
        downloadPDF(pdf);
      } else {
        var hibakod = xmlDoc.getElementsByTagName("hibakod")[0].firstChild.nodeValue;
        var hibauzenet = xmlDoc.getElementsByTagName("hibauzenet")[0].firstChild.nodeValue;
        alert("Hiba! Nr:"+ hibakod + "\n"+hibauzenet);
      }
    });
  }

  const QueryNyugta = () =>{
    if(currentlySelected === "") {
      alert("Kérem válasszon egy nyugtát");
      return;
    }
    var xml = builder.create('xmlnyugtaget');
    xml.att('xmlns','http://www.szamlazz.hu/xmlnyugtaget');
    xml.att('xmlns:xsi','http://www.w3.org/2001/XMLSchema-instance');
    xml.att('xsi:schemaLocation','http://www.szamlazz.hu/xmlnyugtaget http://www.szamlazz.hu/docs/xsds/nyugtaget/xmlnyugtaget.xsd');
    
    var beallitasok = xml.ele('beallitasok');
    beallitasok.ele('szamlaagentkulcs', key);
    beallitasok.ele('pdfLetoltes', true);
    beallitasok.ele('nyugtakep', nyugta.nyugtakep); //

    var fejlec = xml.ele('fejlec');
    fejlec.ele('nyugtaszam', currentlySelected);
    xml.end({ pretty: true});
    
    fetch('https://mid-szamlazz.herokuapp.com/get', {
      method: 'POST',
      body:xml
    })
    .then(response => response.text())
    .then(data => {
      var xmlDoc = parser.parseFromString(data,"text/xml");
      var sikeres = xmlDoc.getElementsByTagName("sikeres")[0].firstChild.nodeValue;
      if(sikeres === "true") {
        alert("Sikeres a lekérdezés!");
        var pdf = xmlDoc.getElementsByTagName("nyugtaPdf")[0].firstChild.nodeValue;
        downloadPDF(pdf);
      } else {
        var hibakod = xmlDoc.getElementsByTagName("hibakod")[0].firstChild.nodeValue;
        var hibauzenet = xmlDoc.getElementsByTagName("hibauzenet")[0].firstChild.nodeValue;
        alert("Hiba! Nr:"+ hibakod + "\n"+hibauzenet);
      }
    });
  }

  const Storno = () =>{
    if(currentlySelected === "") {
      alert("Kérem válasszon egy nyugtát");
      return;
    }
    var xml = builder.create('xmlnyugtast');
    xml.att('xmlns','http://www.szamlazz.hu/xmlnyugtast');
    xml.att('xmlns:xsi','http://www.w3.org/2001/XMLSchema-instance');
    xml.att('xsi:schemaLocation','http://www.szamlazz.hu/xmlnyugtast http://www.szamlazz.hu/docs/xsds/nyugtast/xmlnyugtast.xsd');
    
    var beallitasok = xml.ele('beallitasok');
    beallitasok.ele('szamlaagentkulcs', key);
    beallitasok.ele('pdfLetoltes', true);

    var fejlec = xml.ele('fejlec');
    fejlec.ele('nyugtaszam', currentlySelected);
    xml.end({ pretty: true});
    
    fetch('https://mid-szamlazz.herokuapp.com/storno', {
      method: 'POST',
      body:xml
    })
    .then(response => response.json())
    .then(data => {
      var xmlDoc = parser.parseFromString(data.data,"text/xml");
      
      var sikeres = xmlDoc.getElementsByTagName("sikeres")[0].firstChild.nodeValue;

      if(sikeres === "true") {
        alert("Sikeresen Stornozva!");
        var nyugtaszam = xmlDoc.getElementsByTagName("nyugtaszam")[0].firstChild.nodeValue;
        addNyugtaszamToList(nyugtaszam);
        var pdf = xmlDoc.getElementsByTagName("nyugtaPdf")[0].firstChild.nodeValue;
        downloadPDF(pdf);
      } else {
        var hibakod = xmlDoc.getElementsByTagName("hibakod")[0].firstChild.nodeValue;
        var hibauzenet = xmlDoc.getElementsByTagName("hibauzenet")[0].firstChild.nodeValue;
        alert("Hiba! Nr:"+ hibakod + "\n"+hibauzenet);
      }
    });
  }

  const Email = () =>{
    if(currentlySelected === "") {
      alert("Kérem válasszon egy nyugtát");
      return;
    }
    var xml = builder.create('xmlnyugtasend');
    xml.att('xmlns','http://www.szamlazz.hu/xmlnyugtasend');
    xml.att('xmlns:xsi','http://www.w3.org/2001/XMLSchema-instance');
    xml.att('xsi:schemaLocation','http://www.szamlazz.hu/xmlnyugtasend http://www.szamlazz.hu/docs/xsds/nyugtasend/xmlnyugtasend.xsd');
    
    var beallitasok = xml.ele('beallitasok');
    beallitasok.ele('szamlaagentkulcs', key);

    var fejlec = xml.ele('fejlec');
    fejlec.ele('nyugtaszam', currentlySelected);

    var emailK = xml.ele('emailKuldes');
    emailK.ele('email', email);
    emailK.ele('emailReplyto', email);
    emailK.ele('emailTargy', "Email tárgya"+currentlySelected);
    emailK.ele('emailSzoveg', "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.");

    xml.end({ pretty: true});

    fetch('https://mid-szamlazz.herokuapp.com/email', {
      method: 'POST',
      body:xml
    })
    .then(response => response.json())
    .then(data => {
      var xmlDoc = parser.parseFromString(data.data,"text/xml");
      var sikeres = xmlDoc.getElementsByTagName("sikeres")[0].firstChild.nodeValue;

      if(sikeres === "true") {
        alert("Email küldése sikeres!");
      } else {
        var hibakod = xmlDoc.getElementsByTagName("hibakod")[0].firstChild.nodeValue;
        var hibauzenet = xmlDoc.getElementsByTagName("hibauzenet")[0].firstChild.nodeValue;
        alert("Hiba! Nr:"+ hibakod + "\n"+hibauzenet);
      }
    });
  }

  function downloadPDF(pdf) {
    const linkSource = `data:application/pdf;base64,${pdf}`;
    const downloadLink = document.createElement("a");
    const fileName = "nyugta.pdf";

    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
  }
  
  
  return (
    <div className="App">
      <h2>The user's szamla agent key:&nbsp;{key}</h2>
      <form >
        Szamla Agent Key:
        <input
          type = "text"
          value={key}
          onChange = {changeKey}
        />
      </form>
      <br/>
      <h2>Új nyugta készítése</h2>
      <form>
          <label> Válasszon nyugtaképet:</label>
          <select id="nyugtakep" value={nyugta.nyugtakep} onChange={nyugtaFormChangeHandler}>
              <option value="A">Normál</option>
              <option value="J">Keskeny  </option>
              <option value="L">Keskeny, logóval </option>
          </select><br/><br/>
          
          <label>Válasszon fizetési módot:</label>
          <select id="fizmod" value={nyugta.fizmod} onChange={nyugtaFormChangeHandler}>
              <option value="átutalás"> átutalás </option>
              <option value="készpénz"> készpénz </option>
              <option value="bankkártya"> bankkártya </option>
              <option value="csekk"> csekk </option>
              <option value="utánvét"> utánvét </option>
              <option value="ajándékutalvány"> ajándékutalvány </option>
              <option value="barion"> barion </option>
              <option value="barter"> barter </option>
              <option value="csoportos beszedés"> csoportos beszedés </option>
              <option value="OTP Simple"> OTP Simple </option>
              <option value="kompenzáció"> kompenzáció </option>
              <option value="kupon"> kupon </option>
              <option value="PayPal,PayU"> PayPal,PayU </option>
              <option value="SZÉP kártya"> SZÉP kártya </option>
              <option value="utalvány"> utalvány </option>
          </select><br/><br/>

          <label>Válasszon pénznemet:</label>
          <select id="penznem" value={nyugta.penznem} onChange={nyugtaFormChangeHandler}>
              <option value="HUF">HUF</option>
              <option value="EUR">EUR</option>
              <option value="USD ">USD</option>
          </select><br/><br/>

          <label>Termék megnevezése:</label>
          <input id="megnevezes" required value={nyugta.megnevezes} onChange={nyugtaFormChangeHandler} /><br/><br/>

          <label>Mennyiség:</label>
          <input id="mennyiseg" 
            type="number" 
            step="0.01"
            min="0"
            value={nyugta.mennyiseg} 
            onChange={nyugtaFormChangeHandler}
            required
          /><br/><br/>

          <label >Mennyiségi egység:</label>
          <input id="mennyisegiEgyseg" 
            value={nyugta.mennyisegiEgyseg} 
            onChange={nyugtaFormChangeHandler}
            required
          /><br/><br/>

          <label>A termék netto egységára:</label>
          <input 
            id="nettoEgysegar" 
            type="number" 
            step="0.01" 
            min="0" 
            value={nyugta.nettoEgysegar} 
            onChange={nyugtaFormChangeHandler} 
            required
          /><br/><br/>

          <button  type="button" onClick={CreateNyugta}>Nyugta kiállítása</button><br/><br/>
      </form>     
      <div className="nyugtaList">
        
        <h2>Nyugták listája:</h2>
        
        <ul>
            {nyugtaList.map( val =>(
              <li key={val} id={val} onClick={updateCurrentlySelected}>{val}</li>
            ))}
        </ul>
        <br/>
        <h2>Jelenleg kiválasztott nyugta: {currentlySelected}</h2>
        <br/>
        <button onClick={QueryNyugta}> Lekérdezés </button>
        <br/><br/>
        <button onClick={Storno}> Storno </button>
        <br/><br/>
        <form >
        Email:
        <input
          type = "text"
          value={email}
          onChange = {changeEmail}
        />
        </form>
        <button onClick={Email}> Email </button>
      </div> 
    </div>
  );
    
}

export default App;