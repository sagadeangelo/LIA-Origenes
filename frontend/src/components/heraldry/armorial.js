// Curated exhibits; dates identify the evidence or the illustration as indicated.
const commons='https://commons.wikimedia.org/wiki/File:'
const license='https://creativecommons.org/licenses/by-sa/4.0/'
const armoria='https://www.armoria.info/libro_de_armoria/tovar.html'
const galicia='https://apelidosgalicia.org/tovar-6995'

export const collections={
  Tovar:[
    {id:'castilla',label:'Castilla',family:'Tovar de Castilla',region:'Entorno de Villarcayo, Burgos, según el repertorio',
      blazon:'Campo azul atravesado por una banda de oro. En sus extremos, dos cabezas de dragón verdes parecen engullirla.',
      note:'Azur designa el azul y sinople el verde. La banda desciende desde la izquierda de quien mira. El repertorio recoge también una descripción con las cabezas de oro.',
      evidence:'Coincidencia entre el blasón publicado y la descripción del ilustrador. Rama individual sin identificar.',
      source:'Apelidos de Galicia · Tovar, sección Heráldica',url:galicia,
      credit:'Manuelfb55 · 2021',rights:'CC BY-SA 4.0',rightsUrl:license,
      original:commons+'Escudo_de_Armas_de_Tovar.svg',file:'castilla.svg',
      remote:'https://upload.wikimedia.org/wikipedia/commons/9/9e/Escudo_de_Armas_de_Tovar.svg',
      kind:'Ilustración contemporánea de referencia',fallback:'verde'},
    {id:'aragon',label:'Aragón',family:'Tovar, infanzones de Aragón',region:'Aragón · siglo XVII según Armoria',
      blazon:'Sobre azul, una banda dorada rematada por dragantes también dorados. En la parte inferior, una manga roja deja ver la mano que sujeta un hierro ardiente.',
      note:'El brazo y el hierro distinguen esta descripción de la castellana. La ilustración de sala interpreta el texto de Jesús Sanz Lacorte.',
      evidence:'Descripción de repertorio secundario. Reconstrucción editorial del blasón.',
      source:'Jesús Sanz Lacorte · Libro de armoria, Tovar',url:armoria,
      credit:'LIA Orígenes · dibujo vectorial para esta edición',rights:'CC0 1.0',rightsUrl:'https://creativecommons.org/publicdomain/zero/1.0/',
      kind:'Reconstrucción a partir del blasón',fallback:'aragon'},
    {id:'portugal',label:'Portugal',family:'Tovar en el armorial portugués',region:'Portugal · lámina fechada en 1783',
      blazon:'Escudo de campo azul con pieza diagonal y cabezas en sus extremos. Sobre el yelmo aparece un león azul. La ficha de la lámina no transcribe el blasón completo.',
      note:'La reproducción procede de la página 221 del Tesouro da nobreza de Portugal. El repertorio identifica a los Tovar en Portugal; la adscripción a una persona concreta queda abierta.',
      evidence:'Lámina de armorial identificada por obra y página. Transcripción íntegra de los esmaltes pendiente.',
      source:'Tesouro da nobreza de Portugal · p. 221',url:commons+'COA_Tovar_(Portugal)_-_Tesouro_de_Nobreza,_p._221.jpg',
      credit:'Frei Manuel de Santo António e Silva · 1783',rights:'Dominio público (Commons)',rightsUrl:'https://creativecommons.org/publicdomain/mark/1.0/',
      original:commons+'COA_Tovar_(Portugal)_-_Tesouro_de_Nobreza,_p._221.jpg',file:'portugal.jpg',
      remote:'https://upload.wikimedia.org/wikipedia/commons/3/3a/COA_Tovar_%28Portugal%29_-_Tesouro_de_Nobreza%2C_p._221.jpg',kind:'Reproducción de armorial'}
  ]
}
